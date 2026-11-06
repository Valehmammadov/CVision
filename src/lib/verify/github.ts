/**
 * Server-only: verifies claimed technologies against a candidate's PUBLIC GitHub profile.
 * All data comes live from the GitHub REST API and raw.githubusercontent.com — nothing is inferred
 * or invented. Forked repositories are ignored so evidence reflects the candidate's own work.
 *
 * Limitations: private/company code is invisible, so "no public evidence" does not mean
 * the candidate lacks the skill.
 */
import { VERIFY_SETTINGS } from "@/config/screening";
import type { GithubVerification, RepoEvidence, SkillCheck } from "@/data/candidates";

const API = () => (process.env.GITHUB_API_BASE_URL?.trim() || "https://api.github.com").replace(/\/$/, "");
const RAW = () =>
  (process.env.GITHUB_RAW_BASE_URL?.trim() || "https://raw.githubusercontent.com").replace(/\/$/, "");

interface GhRepo {
  name: string;
  full_name: string;
  html_url: string;
  fork: boolean;
  language: string | null;
  topics?: string[];
  default_branch: string;
  pushed_at: string | null;
  stargazers_count: number;
}

interface GhUser {
  login: string;
  html_url: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
  type: string;
}

class GithubError extends Error {}

const cache = new Map<string, { at: number; data: GithubData }>();

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "CVisionAI-Screening",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API()}${path}`, {
      headers: headers(),
      signal: AbortSignal.timeout(VERIFY_SETTINGS.githubTimeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    throw new GithubError(name === "TimeoutError" ? "GitHub did not respond in time" : "Could not reach GitHub");
  }
  if (res.status === 404) throw new GithubError("GitHub user not found");
  if (res.status === 403 || res.status === 429) {
    if (res.headers.get("x-ratelimit-remaining") === "0") {
      const reset = Number(res.headers.get("x-ratelimit-reset"));
      const mins = reset ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000)) : null;
      throw new GithubError(
        `GitHub rate limit reached${mins ? ` — try again in ~${mins} min` : ""}. Adding a GITHUB_TOKEN raises the limit.`
      );
    }
    throw new GithubError("GitHub refused the request");
  }
  if (!res.ok) throw new GithubError(`GitHub error (HTTP ${res.status})`);
  return (await res.json()) as T;
}

type Deps = Record<string, string>;

async function fetchPackageJson(repo: GhRepo): Promise<Deps | null> {
  const url = `${RAW()}/${repo.full_name}/${encodeURIComponent(repo.default_branch)}/package.json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CVisionAI-Screening" },
      signal: AbortSignal.timeout(VERIFY_SETTINGS.githubTimeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > 500_000) return null;
    const pkg = JSON.parse(text) as Record<string, unknown>;
    const pick = (k: string) => (pkg[k] && typeof pkg[k] === "object" ? (pkg[k] as Deps) : {});
    return { ...pick("dependencies"), ...pick("devDependencies"), ...pick("peerDependencies") };
  } catch {
    return null;
  }
}

interface GithubData {
  user: GhUser;
  own: GhRepo[];
  forks: number;
  pkgs: Map<string, Deps>;
}

async function loadGithub(username: string): Promise<GithubData> {
  const key = username.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < VERIFY_SETTINGS.cacheMinutes * 60_000) return hit.data;

  const user = await ghFetch<GhUser>(`/users/${encodeURIComponent(username)}`);
  const repos = await ghFetch<GhRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`
  );
  const own = repos.filter((r) => !r.fork);
  const jsLike = own
    .filter((r) => !r.language || ["JavaScript", "TypeScript", "Vue", "HTML", "CSS"].includes(r.language))
    .slice(0, VERIFY_SETTINGS.maxPackageJsonRepos);
  const pkgEntries = await Promise.all(jsLike.map(async (r) => [r.full_name, await fetchPackageJson(r)] as const));
  const pkgs = new Map<string, Deps>();
  for (const [name, deps] of pkgEntries) if (deps) pkgs.set(name, deps);

  const data = { user, own, forks: repos.length - own.length, pkgs };
  cache.set(key, { at: Date.now(), data });
  return data;
}

/* ---------------- skill rules ---------------- */

interface Rule {
  languages?: string[];
  deps?: string[];
  topics?: string[];
}

const RULES: Record<string, Rule> = {
  JavaScript: { languages: ["JavaScript", "TypeScript"], topics: ["javascript"] },
  TypeScript: { languages: ["TypeScript"], deps: ["typescript"], topics: ["typescript"] },
  React: {
    deps: ["react", "react-dom", "next", "react-native", "gatsby", "@remix-run/react"],
    topics: ["react", "reactjs", "nextjs", "react-native"],
  },
  "Node.js": {
    deps: ["express", "koa", "fastify", "@nestjs/core", "@hapi/hapi", "socket.io", "mongoose", "pg", "mysql2", "@prisma/client", "prisma", "sequelize", "ws", "nodemon"],
    topics: ["nodejs", "node", "express", "expressjs", "nestjs"],
  },
  "Next.js": { deps: ["next"], topics: ["nextjs"] },
  Vue: { languages: ["Vue"], deps: ["vue", "nuxt"], topics: ["vue", "vuejs", "nuxt"] },
  Angular: { deps: ["@angular/core"], topics: ["angular"] },
  HTML: { languages: ["HTML"] },
  CSS: { languages: ["CSS", "SCSS", "Less"], deps: ["tailwindcss", "sass", "styled-components", "bootstrap"] },
  Python: { languages: ["Python", "Jupyter Notebook"], topics: ["python"] },
  Java: { languages: ["Java", "Kotlin"], topics: ["java", "spring-boot"] },
  "C#/.NET": { languages: ["C#"], topics: ["dotnet", "csharp", "aspnet-core"] },
  SQL: {
    languages: ["PLpgSQL", "TSQL", "PLSQL"],
    deps: ["pg", "mysql", "mysql2", "sqlite3", "better-sqlite3", "prisma", "@prisma/client", "sequelize", "knex", "typeorm", "drizzle-orm"],
    topics: ["sql", "postgresql", "mysql", "sqlite"],
  },
  MongoDB: { deps: ["mongoose", "mongodb"], topics: ["mongodb", "mongoose"] },
  Testing: {
    deps: ["jest", "vitest", "mocha", "cypress", "@playwright/test", "@testing-library/react", "supertest"],
    topics: ["testing", "jest", "cypress"],
  },
  Docker: { topics: ["docker", "docker-compose"] },
  Kubernetes: { topics: ["kubernetes", "k8s", "helm"] },
  Scripting: { languages: ["Shell", "PowerShell"], topics: ["bash", "powershell"] },
  Linux: { topics: ["linux", "bash", "shell"] },
  "Penetration Testing": { topics: ["pentest", "pentesting", "penetration-testing", "ctf", "ctf-writeups", "hacking", "security-tools", "bugbounty"] },
  "Network Security": { topics: ["network-security", "firewall", "ids", "networking"] },
  "Incident Response": { topics: ["incident-response", "dfir", "forensics", "threat-hunting", "soc"] },
  SIEM: { topics: ["siem", "splunk", "wazuh", "elk"] },
  "Vulnerability Management": { topics: ["vulnerability-scanner", "vulnerability-management", "cve"] },
  "Infrastructure as Code": { languages: ["HCL"], topics: ["terraform", "ansible", "infrastructure-as-code"] },
  "CI/CD": { topics: ["ci-cd", "github-actions", "jenkins"] },
  "Machine Learning": { languages: ["Jupyter Notebook"], topics: ["machine-learning", "deep-learning", "tensorflow", "pytorch", "scikit-learn"] },
  "Pandas / NumPy": { topics: ["pandas", "numpy", "data-analysis"] },
  "Data Visualization": { topics: ["data-visualization", "matplotlib", "seaborn", "plotly"] },
  Git: {},
};

function checkSkill(skill: string, data: GithubData): SkillCheck {
  if (skill === "Git") {
    const n = data.own.length;
    return {
      skill,
      checkable: true,
      verified: n > 0,
      evidence: n
        ? [{ repo: `${n} own public repositories`, url: `${data.user.html_url}?tab=repositories`, how: "uses Git & GitHub" }]
        : [],
    };
  }
  const rule = RULES[skill];
  if (!rule) return { skill, checkable: false, verified: false, evidence: [] };

  const evidence: RepoEvidence[] = [];
  for (const repo of data.own) {
    if (evidence.length >= 3) break;
    let how: string | null = null;
    if (rule.languages && repo.language && rule.languages.includes(repo.language)) {
      how = `main language: ${repo.language}`;
    }
    const deps = data.pkgs.get(repo.full_name);
    const dep = deps && rule.deps?.find((d) => d in deps);
    if (!how && dep) how = `package.json: ${dep}`;
    const topic = repo.topics?.find((t) => rule.topics?.includes(t));
    if (!how && topic) how = `topic: ${topic}`;
    if (how) evidence.push({ repo: repo.name, url: repo.html_url, how });
  }
  return { skill, checkable: true, verified: evidence.length > 0, evidence };
}

export async function verifyGithub(username: string, claimedSkills: string[]): Promise<GithubVerification> {
  try {
    const data = await loadGithub(username);
    const langCount = new Map<string, number>();
    for (const r of data.own) if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
    const lastPush = data.own.map((r) => r.pushed_at).filter(Boolean).sort().pop() ?? null;

    return {
      status: "ok",
      username: data.user.login,
      profileUrl: data.user.html_url,
      name: data.user.name,
      avatarUrl: data.user.avatar_url,
      publicRepos: data.user.public_repos,
      followers: data.user.followers,
      createdAt: data.user.created_at,
      lastPushAt: lastPush,
      ownReposAnalyzed: data.own.length,
      forksIgnored: data.forks,
      topLanguages: [...langCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([language, repos]) => ({ language, repos })),
      skills: claimedSkills.map((s) => checkSkill(s, data)),
    };
  } catch (err) {
    return {
      status: "error",
      username,
      profileUrl: `https://github.com/${username}`,
      error: err instanceof GithubError ? err.message : "Unexpected error while checking GitHub",
    };
  }
}
