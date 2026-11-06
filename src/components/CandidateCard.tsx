"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fitStyles, type Candidate } from "@/data/candidates";
import { cn } from "@/lib/utils";

interface Props {
  candidate: Candidate;
  index: number;
  onSelect: (c: Candidate) => void;
}

export function ScoreRing({ score, hex, size = 72 }: { score: number; hex: string; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
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
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#0b1f3a]">
        {score}%
      </span>
    </div>
  );
}

export function CandidateCard({ candidate, index, onSelect }: Props) {
  const style = fitStyles[candidate.fit];

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
        className="cursor-pointer p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-start gap-4">
          <ScoreRing score={candidate.score} hex={style.hex} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[#0b1f3a]">{candidate.name}</h3>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", style.bg, style.text)}>
                {candidate.label}
              </span>
            </div>
            <p className="text-sm text-slate-500">{candidate.targetRole}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", style.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${candidate.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
          <ChevronRight className="mt-1 hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
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
