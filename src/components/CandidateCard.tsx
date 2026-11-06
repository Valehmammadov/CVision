"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarCheck, Check, ChevronRight, FolderGit2, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fitStyles, type Candidate, type Decision, type VerificationResult } from "@/data/candidates";
import { cn } from "@/lib/utils";

interface Props {
  candidate: Candidate;
  index: number;
  rank?: number;
  showRank?: boolean;
  decision?: Decision;
  verification?: VerificationResult;
  onSelect: (c: Candidate) => void;
}

export function verificationSummary(v?: VerificationResult) {
  const gh = v?.github;
  if (!gh || gh.status !== "ok" || !gh.skills) return null;
  const checkable = gh.skills.filter((s) => s.checkable);
  return { verified: checkable.filter((s) => s.verified).length, total: checkable.length };
}

export function DecisionChip({ decision }: { decision?: Decision }) {
  if (!decision) return null;
  return decision === "invited" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
      <CalendarCheck className="h-3 w-3" /> Interview invited
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      <XCircle className="h-3 w-3" /> Rejected
    </span>
  );
}

export function ScoreRing({ score, hex, size = 72 }: { score: number; hex: string; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-navy">
        {score}%
      </span>
    </div>
  );
}

export function CandidateCard({ candidate, index, rank, showRank, decision, verification, onSelect }: Props) {
  const style = fitStyles[candidate.fit];
  const vs = verificationSummary(verification);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.1 }}
      whileHover={{ y: -2 }}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onSelect(candidate)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(candidate);
          }
        }}
        aria-label={`View details for ${candidate.name}`}
        className="group cursor-pointer p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-start gap-4">
          <ScoreRing score={candidate.score} hex={style.hex} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {showRank && rank ? (
                <span className="rounded-md bg-navy-solid px-1.5 py-0.5 text-[11px] font-bold text-white">
                  #{rank}
                </span>
              ) : null}
              <h3 className="text-base font-semibold text-navy">{candidate.name}</h3>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", style.bg, style.text)}>
                {candidate.label}
              </span>
              <DecisionChip decision={decision} />
              {vs && (
                <span
                  title="Claimed skills with public evidence on GitHub"
                  className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700"
                >
                  <FolderGit2 className="h-3 w-3" />
                  {vs.verified}/{vs.total} skills verified
                </span>
              )}
              {!vs && candidate.profiles?.github && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-surface px-2 py-0.5 text-xs text-slate-500">
                  <BadgeCheck className="h-3 w-3" /> GitHub linked
                </span>
              )}
            </div>
            <p className="truncate text-sm text-slate-500">
              {candidate.targetRole}
              {candidate.fileName && <span className="text-slate-400"> · {candidate.fileName}</span>}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", style.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${candidate.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="mt-1 hidden shrink-0 items-center gap-0.5 text-xs font-medium text-slate-400 transition-colors group-hover:text-blue-600 sm:flex">
            <span className="opacity-0 transition-opacity group-hover:opacity-100">View details</span>
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Key strengths
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.strengths.map((s) => (
                <Badge key={s} variant="strength">
                  <Check className="h-3 w-3" />
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Skill gaps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.gaps.length === 0 && (
              <span className="text-xs text-slate-400">No significant gaps found</span>
            )}
            {candidate.gaps.map((g) => (
                <Badge key={g} variant="gap">
                  <X className="h-3 w-3" />
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("mt-4 flex items-center justify-between rounded-lg border px-3 py-2", style.bg)}>
          <span className="text-xs font-medium text-slate-500">Recommendation</span>
          <span className={cn("text-sm font-semibold", style.text)}>{candidate.verdict}</span>
        </div>
      </Card>
    </motion.div>
  );
}
