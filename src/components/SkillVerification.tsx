"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CircleMinus,
  CircleSlash,
  ExternalLink,
  FolderGit2,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Candidate, SkillCheck, VerificationResult } from "@/data/candidates";
import { cn } from "@/lib/utils";

interface Props {
  candidate: Candidate;
  result?: VerificationResult;
  onResult: (v: VerificationResult) => void;
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function SkillVerification({ candidate, result, onResult }: Props) {
  const profiles = candidate.profiles;
  const [github, setGithub] = useState(profiles?.github?.username ?? "");
  const [portfolio, setPortfolio] = useState(profiles?.portfolio[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = candidate.method === "demo";

  async function verify() {
    if (loading || (!github.trim() && !portfolio.trim())) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github, portfolio, claimedSkills: candidate.claimedSkills ?? [] }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkedAt) throw new Error(data?.error ?? `Verification failed (HTTP ${res.status})`);
      onResult(data as VerificationResult);
      const gh = (data as VerificationResult).github;
      if (gh?.status === "ok" && gh.skills) {
        const c = gh.skills.filter((s) => s.checkable);
        toast.success("Verification complete", {
          description: `${c.filter((s) => s.verified).length} of ${c.length} claimed skills have public evidence on GitHub.`,
        });
      }
    } catch (err) {
      const msg =
        (err as { name?: string })?.name === "TimeoutError"
          ? "Verification timed out. Please try again."
          : (err as Error).message || "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200" data-testid="skill-verification">
      <div className="border-b border-slate-200 px-4 py-3">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-navy">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Skill verification
        </h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Checks the technologies claimed in the CV against the candidate&apos;s public profiles, using live
          data. Nothing is generated.
        </p>
      </div>

      {isDemo ? (
        <p className="px-4 py-3 text-xs text-slate-500">
          Available for analyzed CVs. Demo profiles are fictional, so there is nothing real to verify.
        </p>
      ) : (
        <div className="space-y-3 px-4 py-3">
          {candidate.claimedSkills && candidate.claimedSkills.length > 0 && (
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Claimed in CV:</span> {candidate.claimedSkills.join(", ")}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <LinkInput
              id={`gh-${candidate.id}`}
              icon={<FolderGit2 className="h-3.5 w-3.5" />}
              label="GitHub username or URL"
              value={github}
              onChange={setGithub}
              found={!!profiles?.github}
              placeholder="e.g. octocat"
            />
            <LinkInput
              id={`pf-${candidate.id}`}
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Portfolio website"
              value={portfolio}
              onChange={setPortfolio}
              found={!!profiles?.portfolio.length}
              placeholder="e.g. janedoe.dev"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <UserRound className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
            {profiles?.linkedin ? (
              <span>
                <a
                  href={profiles.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                >
                  Open LinkedIn profile <ExternalLink className="h-3 w-3" />
                </a>{" "}
                (manual check: LinkedIn has no public API and doesn&apos;t allow automated access)
              </span>
            ) : (
              <span>No LinkedIn link found in the CV. LinkedIn can only be checked manually.</span>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={verify}
            disabled={loading || (!github.trim() && !portfolio.trim())}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking public profiles…
              </>
            ) : result ? (
              <>
                <RefreshCw className="h-4 w-4" /> Re-check profiles
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Verify skills online
              </>
            )}
          </Button>
          {!github.trim() && !portfolio.trim() && (
            <p className="text-xs text-slate-400">
              No GitHub or portfolio link was found in this CV. Enter one above if the candidate shared it.
            </p>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {result.github && <GithubResult r={result} />}
                {result.portfolio && <PortfolioResult r={result} />}
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Fetched live at {new Date(result.checkedAt).toLocaleTimeString("en-GB")}. Only public data is
                  used. No public evidence doesn&apos;t mean the skill is missing, because work code is often
                  private.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function LinkInput(props: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  found: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
        {props.icon}
        {props.label}
        {props.found && <span className="rounded bg-emerald-50 px-1 text-emerald-700">found in CV</span>}
      </label>
      <input
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function SkillRow({ s }: { s: SkillCheck }) {
  const Icon = !s.checkable ? CircleSlash : s.verified ? CheckCircle2 : CircleMinus;
  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          !s.checkable ? "text-slate-300" : s.verified ? "text-emerald-600" : "text-amber-500"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700">
          {s.skill}{" "}
          <span
            className={cn(
              "text-xs font-normal",
              !s.checkable ? "text-slate-400" : s.verified ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {!s.checkable ? "can't be checked on GitHub" : s.verified ? "verified" : "no public evidence"}
          </span>
        </p>
        {s.evidence.length > 0 && (
          <ul className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {s.evidence.map((e) => (
              <li key={e.url + e.how} className="text-xs text-slate-500">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
                >
                  {e.repo}
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                <span className="text-slate-400">({e.how})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function GithubResult({ r }: { r: VerificationResult }) {
  const gh = r.github!;
  if (gh.status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
        <p className="font-semibold">GitHub check failed</p>
        <p>{gh.error}</p>
        {gh.profileUrl && (
          <a href={gh.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 underline">
            Open {gh.profileUrl.replace("https://", "")} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }
  const checkable = (gh.skills ?? []).filter((s) => s.checkable);
  const verified = checkable.filter((s) => s.verified).length;

  return (
    <div className="rounded-lg border border-slate-200" data-testid="github-result">
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5">
        {gh.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gh.avatarUrl}
            alt=""
            width={36}
            height={36}
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="h-9 w-9 rounded-full border border-slate-200"
          />
        )}
        <div className="min-w-0 flex-1">
          <a
            href={gh.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline"
          >
            {gh.name || gh.username} <span className="font-normal text-slate-400">@{gh.username}</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          <p className="text-xs text-slate-500">
            {gh.publicRepos} public repos · on GitHub since {fmtDate(gh.createdAt)} · last push{" "}
            {fmtDate(gh.lastPushAt)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            checkable.length && verified === checkable.length
              ? "bg-emerald-50 text-emerald-700"
              : verified > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          )}
          data-testid="github-summary"
        >
          {verified}/{checkable.length} verified
        </span>
      </div>
      <ul className="divide-y divide-slate-100 px-3">
        {(gh.skills ?? []).map((s) => (
          <SkillRow key={s.skill} s={s} />
        ))}
      </ul>
      <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
        {gh.topLanguages && gh.topLanguages.length > 0 && (
          <p>
            <span className="font-medium text-slate-600">Top languages:</span>{" "}
            {gh.topLanguages.map((l) => `${l.language} (${l.repos})`).join(", ")}
          </p>
        )}
        <p className="text-slate-400">
          Analyzed {gh.ownReposAnalyzed} own repositories
          {gh.forksIgnored ? `; ${gh.forksIgnored} forks ignored` : ""}.
        </p>
      </div>
    </div>
  );
}

function PortfolioResult({ r }: { r: VerificationResult }) {
  const p = r.portfolio!;
  if (p.status === "error") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="alert">
        <p className="font-semibold">Portfolio check failed: {p.url}</p>
        <p>{p.error}</p>
      </div>
    );
  }
  const claimed = new Set(r.claimedSkills);
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600" data-testid="portfolio-result">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
        <Globe className="h-4 w-4 text-slate-400" />
        Portfolio reachable
        <span className="text-xs font-normal text-emerald-700">HTTP {p.httpStatus}</span>
      </p>
      <a
        href={p.finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-blue-600 hover:underline"
      >
        {p.title || p.finalUrl} <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      <p className="mt-1">
        <span className="font-medium text-slate-600">Technologies mentioned on the site:</span>{" "}
        {p.skillsMentioned?.length
          ? p.skillsMentioned.map((s, i) => (
              <span key={s} className={claimed.has(s) ? "font-semibold text-emerald-700" : ""}>
                {s}
                {i < p.skillsMentioned!.length - 1 ? ", " : ""}
              </span>
            ))
          : "none detected"}
      </p>
    </div>
  );
}
