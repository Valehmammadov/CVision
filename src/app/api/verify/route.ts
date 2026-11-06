/**
 * POST /api/verify — checks a candidate's claimed technologies against PUBLIC online profiles.
 * Body: { github?: string (username or URL), portfolio?: string (URL), claimedSkills: string[] }
 * All returned data is fetched live; failures are reported, never filled in.
 * LinkedIn is not fetched (no public API; scraping is against its terms) — the UI links to it for manual review.
 */
import type { VerificationResult } from "@/data/candidates";
import { githubUsernameFrom } from "@/lib/screening/links";
import { TECH_SKILL_NAMES } from "@/lib/screening/ruleEngine";
import { verifyGithub } from "@/lib/verify/github";
import { verifyPortfolio } from "@/lib/verify/portfolio";

const DEFAULT_SKILLS = ["JavaScript", "React", "Node.js"];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const githubInput = typeof body.github === "string" ? body.github.trim() : "";
  const portfolioInput = typeof body.portfolio === "string" ? body.portfolio.trim() : "";
  if (!githubInput && !portfolioInput)
    return Response.json({ error: "Provide a GitHub username/URL or a portfolio URL." }, { status: 400 });

  const username = githubInput ? githubUsernameFrom(githubInput) : null;
  if (githubInput && !username)
    return Response.json({ error: "That doesn't look like a valid GitHub username or profile URL." }, { status: 400 });

  let portfolioUrl: string | null = null;
  if (portfolioInput) {
    const withScheme = /^https?:\/\//i.test(portfolioInput) ? portfolioInput : `https://${portfolioInput}`;
    try {
      portfolioUrl = new URL(withScheme).toString();
    } catch {
      return Response.json({ error: "Portfolio link is not a valid URL." }, { status: 400 });
    }
  }

  const claimed = Array.isArray(body.claimedSkills)
    ? body.claimedSkills.filter((s): s is string => typeof s === "string" && TECH_SKILL_NAMES.includes(s))
    : [];
  const claimedSkills = claimed.length ? [...new Set(claimed)] : DEFAULT_SKILLS;

  const [github, portfolio] = await Promise.all([
    username ? verifyGithub(username, claimedSkills) : Promise.resolve(undefined),
    portfolioUrl ? verifyPortfolio(portfolioUrl) : Promise.resolve(undefined),
  ]);

  const result: VerificationResult = {
    checkedAt: new Date().toISOString(),
    claimedSkills,
    github,
    portfolio,
  };
  return Response.json(result);
}
