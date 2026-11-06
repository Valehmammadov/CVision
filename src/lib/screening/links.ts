/**
 * Finds GitHub, LinkedIn and portfolio links in CV text and embedded hyperlinks.
 * Only links the candidate provided are used — nothing is searched for by name.
 */
import type { ProfileLinks } from "@/data/candidates";

const GITHUB_RESERVED = new Set([
  "about", "features", "pricing", "orgs", "topics", "explore", "marketplace", "settings",
  "login", "join", "sponsors", "collections", "trending", "apps", "site", "contact", "enterprise",
]);

const IGNORED_HOSTS =
  /(^|\.)(linkedin\.com|github\.com|gmail\.com|google\.com|outlook\.com|yahoo\.com|hotmail\.com|europa\.eu|facebook\.com|instagram\.com|twitter\.com|x\.com|t\.me|wa\.me|mailto)$/i;

/** GitHub usernames: 1–39 chars, alphanumeric or single hyphens. */
export const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

function toUrl(raw: string): URL | null {
  let s = raw.trim().replace(/[),.;:'"\]>]+$/, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? u : null;
  } catch {
    return null;
  }
}

export function githubUsernameFrom(input: string): string | null {
  const trimmed = input.trim().replace(/^@/, "");
  if (GITHUB_USERNAME.test(trimmed)) return trimmed;
  const u = toUrl(trimmed);
  if (!u || !/(^|\.)github\.com$/i.test(u.hostname)) return null;
  const user = u.pathname.split("/").filter(Boolean)[0];
  return user && GITHUB_USERNAME.test(user) && !GITHUB_RESERVED.has(user.toLowerCase()) ? user : null;
}

export function detectProfileLinks(text: string, embeddedLinks: string[] = []): ProfileLinks {
  const candidates: string[] = [...embeddedLinks];
  const URL_LIKE =
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|io|dev|me|app|net|org|az|tech|site|xyz|co|page|pages\.dev|vercel\.app|netlify\.app|github\.io)(?:\/[^\s)<>"']*)?/gi;
  // Remove e-mail addresses first so "name@example.com" isn't mistaken for a website.
  const withoutEmails = text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, " ");
  for (const m of withoutEmails.matchAll(URL_LIKE)) candidates.push(m[0]);

  const links: ProfileLinks = { portfolio: [] };
  for (const raw of candidates) {
    if (/^mailto:/i.test(raw) || /@/.test(raw.split("/")[0])) continue;
    const u = toUrl(raw);
    if (!u) continue;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "github.com") {
      const user = githubUsernameFrom(u.toString());
      if (user && !links.github) links.github = { username: user, url: `https://github.com/${user}` };
    } else if (host.endsWith("linkedin.com")) {
      if (/^\/in\/[^/]+/i.test(u.pathname) && !links.linkedin)
        links.linkedin = `https://www.linkedin.com${u.pathname.replace(/\/$/, "")}`;
    } else if (host.endsWith(".github.io")) {
      // user.github.io pages are portfolios and also identify the GitHub user.
      const user = host.split(".")[0];
      if (!links.github && GITHUB_USERNAME.test(user))
        links.github = { username: user, url: `https://github.com/${user}` };
      links.portfolio.push(`https://${host}${u.pathname === "/" ? "" : u.pathname}`);
    } else if (!IGNORED_HOSTS.test(host)) {
      links.portfolio.push(`${u.protocol}//${host}${u.pathname === "/" ? "" : u.pathname}`);
    }
  }
  links.portfolio = [...new Set(links.portfolio)].slice(0, 3);
  return links;
}
