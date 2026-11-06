"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/CandidateCard";
import { fitStyles, type Candidate } from "@/data/candidates";
import { cn } from "@/lib/utils";

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
}

export function CandidateDetailModal({ candidate, onClose }: Props) {
  useEffect(() => {
    if (!candidate) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [candidate, onClose]);

  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1f3a]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${candidate.name} details`}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Detail candidate={candidate} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Detail({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const style = fitStyles[candidate.fit];
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={candidate.score} hex={style.hex} size={84} />
          <div>
            <h3 className="text-xl font-bold text-[#0b1f3a]">{candidate.name}</h3>
            <p className="text-sm text-slate-500">{candidate.targetRole}</p>
            <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold", style.bg, style.text)}>
              {candidate.label}
            </span>
          </div>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("mt-5 flex items-center justify-between rounded-lg border px-4 py-3", style.bg)}>
        <span className="text-sm text-slate-500">Recommendation</span>
        <span className={cn("font-semibold", style.text)}>{candidate.verdict}</span>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-[#0b1f3a]">Key strengths</h4>
        <div className="flex flex-wrap gap-1.5">
          {candidate.strengths.map((s) => (
            <Badge key={s} variant="strength">
              <Check className="h-3 w-3" />
              {s}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-[#0b1f3a]">Skill gaps</h4>
        <div className="flex flex-wrap gap-1.5">
          {candidate.gaps.map((g) => (
            <Badge key={g} variant="gap">
              <X className="h-3 w-3" />
              {g}
            </Badge>
          ))}
        </div>
      </div>

      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Fictional demonstration profile. The score shown is a hard-coded demo
        value, not an AI-generated result.
      </p>

      <Button variant="outline" className="mt-5 w-full" onClick={onClose}>
        Close
      </Button>
    </>
  );
}
