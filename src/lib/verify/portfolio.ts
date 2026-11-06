/**
 * Server-only: fetches a candidate's public portfolio page and lists the technologies it mentions.
 *
 * Because the URL comes from an uploaded CV, requests are restricted to public http(s) hosts:
 * private, loopback and link-local addresses are refused (SSRF protection) and every redirect
 * is re-checked.
 */
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { VERIFY_SETTINGS } from "@/config/screening";
import type { PortfolioVerification } from "@/data/candidates";
import { detectClaimedSkills } from "@/lib/screening/ruleEngine";

class PortfolioError extends Error {}

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3],
];

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const n = ipv4ToInt(ip);
    return PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PortfolioError("Invalid URL");
  }
  if (!/^https?:$/.test(url.protocol)) throw new PortfolioError("Only http and https links can be checked");
  if (url.username || url.password) throw new PortfolioError("Links with credentials are not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local"))
    throw new PortfolioError("Private addresses cannot be checked");
  if (url.port && !["80", "443"].includes(url.port)) throw new PortfolioError("Non-standard ports are not allowed");

  let addresses: string[];
  if (isIP(host)) addresses = [host];
  else {
    try {
      addresses = (await lookup(host, { all: true })).map((a) => a.address);
    } catch {
      throw new PortfolioError("Website address could not be found (DNS)");
    }
  }
  if (addresses.some(isPrivateAddress)) throw new PortfolioError("Private addresses cannot be checked");
  return url;
}

async function readLimited(res: Response, maxBytes: number) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  void reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, maxBytes));
  let off = 0;
  for (const c of chunks) {
    const part = c.slice(0, buf.length - off);
    buf.set(part, off);
    off += part.length;
    if (off >= buf.length) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

export async function verifyPortfolio(rawUrl: string): Promise<PortfolioVerification> {
  try {
    let url = await assertPublicUrl(rawUrl);
    let res: Response | null = null;
    for (let hop = 0; hop <= VERIFY_SETTINGS.portfolioMaxRedirects; hop++) {
      try {
        res = await fetch(url, {
          redirect: "manual",
          headers: { "User-Agent": "CVisionAI-Screening (portfolio check)", Accept: "text/html,text/plain" },
          signal: AbortSignal.timeout(VERIFY_SETTINGS.portfolioTimeoutMs),
          cache: "no-store",
        });
      } catch (err) {
        const name = (err as { name?: string })?.name;
        throw new PortfolioError(name === "TimeoutError" ? "Website did not respond in time" : "Website could not be reached");
      }
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        url = await assertPublicUrl(new URL(location, url).toString());
        continue;
      }
      break;
    }
    if (!res) throw new PortfolioError("Website could not be reached");
    if (res.status >= 300 && res.status < 400) throw new PortfolioError("Too many redirects");
    if (!res.ok) {
      return { status: "error", url: rawUrl, finalUrl: url.toString(), httpStatus: res.status, error: `Website returned HTTP ${res.status}` };
    }
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/(html|plain)|application\/xhtml/i.test(type))
      throw new PortfolioError(`Not a web page (${type.split(";")[0] || "unknown type"})`);

    const body = await readLimited(res, VERIFY_SETTINGS.portfolioMaxBytes);
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 120) ?? null;
    const text = /html/i.test(type) ? htmlToText(body) : body;

    return {
      status: "ok",
      url: rawUrl,
      finalUrl: url.toString(),
      httpStatus: res.status,
      title,
      skillsMentioned: detectClaimedSkills(text),
    };
  } catch (err) {
    return {
      status: "error",
      url: rawUrl,
      error: err instanceof PortfolioError ? err.message : "Unexpected error while checking the website",
    };
  }
}
