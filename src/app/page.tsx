"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { JobDescription } from "@/components/JobDescription";
import { CVUpload } from "@/components/CVUpload";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";
import { CandidateList } from "@/components/CandidateList";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import { ExtractionIssues } from "@/components/ExtractionIssues";
import {
  demoCandidates,
  defaultJobDescription,
  defaultJobTitle,
  type Candidate,
  type Decision,
  type ExtractionFailure,
  type ResultsMethod,
  type RunStats,
  type VerificationResult,
} from "@/data/candidates";
import { ExtractionError, extractCvText } from "@/lib/screening/extract";
import { screenCvRuleBased } from "@/lib/screening/ruleEngine";
import { detectProfileLinks } from "@/lib/screening/links";

const API_TIMEOUT_MS = 90_000;

export default function Home() {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>(demoCandidates);
  const [method, setMethod] = useState<ResultsMethod>("demo");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [failures, setFailures] = useState<ExtractionFailure[]>([]);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  /** Job the current results were screened against (to flag stale results after edits). */
  const [analyzedJob, setAnalyzedJob] = useState<{ title: string; description: string } | null>(null);
  /** Recruiter decisions and online verifications, keyed by candidate id. */
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});

  const setDecision = useCallback((id: string, d: Decision | null) => {
    setDecisions((prev) => {
      const next = { ...prev };
      if (d) next[id] = d;
      else delete next[id];
      return next;
    });
  }, []);
  const saveVerification = useCallback((id: string, v: VerificationResult) => {
    setVerifications((prev) => ({ ...prev, [id]: v }));
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [jobError, setJobError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const closeDetail = useCallback(() => setSelected(null), []);

  // Ask the server which engine is available (no secrets are returned).
  useEffect(() => {
    fetch("/api/screen")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setGeminiReady(Boolean(d?.geminiConfigured)))
      .catch(() => setGeminiReady(false));
  }, []);

  // Clear validation messages as soon as the user fixes the problem.
  const handleDescriptionChange = (value: string) => {
    setJobDescription(value);
    if (value.trim()) setJobError(null);
  };
  const handleFilesChange = (next: File[]) => {
    setFiles(next);
    if (next.length) setUploadError(null);
  };

  async function handleAnalyze() {
    if (isAnalyzing) return;
    const noJob = !jobDescription.trim();
    const noFiles = files.length === 0;
    setJobError(noJob ? "Please enter a job description before analyzing." : null);
    setUploadError(noFiles ? "Please upload at least one CV (PDF or DOCX)." : null);
    if (noJob || noFiles) {
      toast.error("Can't start analysis yet", {
        description: [noJob && "Job description is empty.", noFiles && "No CVs uploaded."]
          .filter(Boolean)
          .join(" "),
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(2);
    const started = performance.now();
    const batch = [...files];
    const extracted: { id: string; fileName: string; text: string }[] = [];
    const embeddedLinks = new Map<string, string[]>();
    const failed: ExtractionFailure[] = [];

    try {
      // 1. Extract text in the browser.
      for (let i = 0; i < batch.length; i++) {
        const file = batch[i];
        setStage(`Extracting text from ${file.name} (${i + 1}/${batch.length})…`);
        try {
          const { text, links } = await extractCvText(file);
          const id = `${file.name}-${file.size}-${i}`;
          extracted.push({ id, fileName: file.name, text });
          embeddedLinks.set(id, links);
        } catch (err) {
          if (!(err instanceof ExtractionError)) console.error(`Extraction failed for ${file.name}:`, err);
          failed.push({
            fileName: file.name,
            reason:
              err instanceof ExtractionError
                ? err.message
                : "Unexpected error while reading this file. Please try re-saving it as PDF or DOCX.",
          });
        }
        setProgress(5 + ((i + 1) / batch.length) * 60);
      }

      setFailures(failed);
      if (extracted.length === 0) {
        toast.error("No CVs could be analyzed", {
          description: "None of the files contained readable text. See the details in the results panel.",
        });
        return;
      }

      // 2. Score on the server (Gemini if configured, otherwise rule-based).
      setStage(geminiReady ? "Evaluating candidates with Gemini…" : "Scoring candidates…");
      setProgress(75);
      let results: Candidate[];
      let runMethod: ResultsMethod;
      try {
        const res = await fetch("/api/screen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, jobDescription, cvs: extracted }),
          signal: AbortSignal.timeout(API_TIMEOUT_MS),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.candidates) throw new Error(data?.error ?? `HTTP ${res.status}`);
        results = data.candidates;
        runMethod = data.method;
      } catch (err) {
        // Server unreachable: the rule-based engine also runs in the browser.
        console.warn("Screening API failed, scoring in the browser:", err);
        results = extracted
          .map((cv) => ({
            ...screenCvRuleBased({ ...cv, jobTitle, jobDescription }),
            methodNote: "Screening server unavailable — rule-based scoring was run in the browser.",
          }))
          .sort((a, b) => b.score - a.score);
        runMethod = "rule-based";
      }

      // Attach public profile links found in each CV (text + embedded hyperlinks).
      const textById = new Map(extracted.map((cv) => [cv.id, cv.text]));
      results = results.map((c) => ({
        ...c,
        profiles: detectProfileLinks(textById.get(c.id) ?? "", embeddedLinks.get(c.id) ?? []),
      }));

      setProgress(100);
      const elapsed = (performance.now() - started) / 1000;
      setCandidates(results);
      setAnalyzedJob({ title: jobTitle, description: jobDescription });
      setDecisions({});
      setVerifications({});
      setMethod(runMethod);
      setStats({
        screened: results.length,
        topMatch: results[0]?.score ?? 0,
        secondsPerCv: elapsed / batch.length,
      });

      const methodText =
        runMethod === "ai" ? "AI-assisted analysis" : runMethod === "mixed" ? "AI-assisted + rule-based" : "rule-based analysis";
      toast.success("Analysis complete", {
        description:
          `${results.length} CV${results.length > 1 ? "s" : ""} screened · ${methodText}` +
          (failed.length ? ` · ${failed.length} file${failed.length > 1 ? "s" : ""} skipped` : ""),
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setStage("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header geminiReady={geminiReady} />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8 lg:py-8">
        <div className="space-y-6">
          <JobDescription
            title={jobTitle}
            description={jobDescription}
            onTitleChange={setJobTitle}
            onDescriptionChange={handleDescriptionChange}
            error={jobError}
            disabled={isAnalyzing}
          />
          <CVUpload
            files={files}
            onFilesChange={handleFilesChange}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            progress={progress}
            stage={stage}
            analyzeError={uploadError}
          />
        </div>

        <div className="space-y-6">
          <AnalyticsSummary stats={stats} />
          <ExtractionIssues failures={failures} onDismiss={() => setFailures([])} />
          <CandidateList
            candidates={candidates}
            method={method}
            jobChanged={
              !!analyzedJob && (analyzedJob.title !== jobTitle || analyzedJob.description !== jobDescription)
            }
            decisions={decisions}
            verifications={verifications}
            onSelect={setSelected}
          />
        </div>
      </main>
      <CandidateDetailModal
        candidate={selected}
        onClose={closeDetail}
        decision={selected ? decisions[selected.id] : undefined}
        onDecision={setDecision}
        verification={selected ? verifications[selected.id] : undefined}
        onVerified={saveVerification}
      />
    </div>
  );
}
