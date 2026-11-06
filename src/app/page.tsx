"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { JobDescription } from "@/components/JobDescription";
import { CVUpload } from "@/components/CVUpload";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";
import { CandidateList } from "@/components/CandidateList";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import {
  candidates,
  defaultJobDescription,
  defaultJobTitle,
  type Candidate,
} from "@/data/candidates";

export default function Home() {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);

  // Full CV processing comes in a later stage; for now Analyze only logs selection.
  function handleAnalyze() {
    console.info(`Analyze requested for ${files.length} file(s) — not implemented yet.`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8 lg:py-8">
        <div className="space-y-6">
          <JobDescription
            title={jobTitle}
            description={jobDescription}
            onTitleChange={setJobTitle}
            onDescriptionChange={setJobDescription}
          />
          <CVUpload files={files} onFilesChange={setFiles} onAnalyze={handleAnalyze} />
        </div>

        <div className="space-y-6">
          <AnalyticsSummary />
          <CandidateList candidates={candidates} onSelect={setSelected} />
        </div>
      </main>
      <CandidateDetailModal candidate={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
