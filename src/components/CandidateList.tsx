"use client";

import type { Candidate } from "@/data/candidates";
import { CandidateCard } from "@/components/CandidateCard";

interface Props {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
}

export function CandidateList({ candidates, onSelect }: Props) {
  return (
    <section aria-labelledby="candidates-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="candidates-heading" className="text-lg font-semibold text-[#0b1f3a]">
          Candidates
        </h2>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
          Demo profiles (fictional)
        </span>
      </div>
      <div className="space-y-4">
        {candidates.map((c, i) => (
          <CandidateCard key={c.id} candidate={c} index={i} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
