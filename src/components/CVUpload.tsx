"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { UPLOAD_LIMITS } from "@/config/screening";

const ACCEPTED_EXTENSIONS = UPLOAD_LIMITS.acceptedExtensions;
const MAX_FILE_SIZE_MB = UPLOAD_LIMITS.maxFileSizeMB;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = UPLOAD_LIMITS.maxFiles;

function hasAcceptedExtension(name: string) {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function fileKey(f: File) {
  return `${f.name.toLowerCase()}::${f.size}`;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  progress: number;
  stage: string;
  /** Validation message from the Analyze step (e.g. no files). */
  analyzeError: string | null;
}

export function CVUpload({
  files,
  onFilesChange,
  onAnalyze,
  isAnalyzing,
  progress,
  stage,
  analyzeError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const nextErrors: string[] = [];
    const seen = new Set(files.map(fileKey));
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!hasAcceptedExtension(file.name)) {
        nextErrors.push(`"${file.name}" is not supported. Please upload PDF or DOCX files.`);
      } else if (file.size > MAX_FILE_SIZE) {
        nextErrors.push(
          `"${file.name}" is ${formatSize(file.size)}, which is over the ${MAX_FILE_SIZE_MB} MB limit.`
        );
      } else if (file.size === 0) {
        nextErrors.push(`"${file.name}" is empty.`);
      } else if (seen.has(fileKey(file))) {
        nextErrors.push(`"${file.name}" has already been added.`);
      } else if (files.length + accepted.length >= MAX_FILES) {
        nextErrors.push(`"${file.name}" was skipped — you can upload up to ${MAX_FILES} CVs at a time.`);
      } else {
        seen.add(fileKey(file));
        accepted.push(file);
      }
    }

    setErrors(nextErrors);
    if (accepted.length) onFilesChange([...files, ...accepted]);
  }

  function removeFile(key: string) {
    onFilesChange(files.filter((f) => fileKey(f) !== key));
  }

  const showNoFilesError = analyzeError && files.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate CVs</CardTitle>
        <CardDescription>Add the CVs you want screened.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isAnalyzing) setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!isAnalyzing) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200",
            dragging
              ? "scale-[1.01] border-blue-500 bg-blue-50"
              : showNoFilesError
                ? "border-red-300 bg-red-50/40"
                : "border-slate-300 bg-slate-50/60 hover:border-blue-400",
            isAnalyzing && "pointer-events-none opacity-60"
          )}
        >
          <motion.div
            animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"
          >
            <UploadCloud className="h-6 w-6" />
          </motion.div>
          <p className="font-semibold text-navy">
            {dragging ? "Release to add files" : "Drop candidate CVs here"}
          </p>
          <p className="mb-4 text-sm text-slate-500">
            Upload PDF or DOCX files · up to {MAX_FILES} files, {MAX_FILE_SIZE_MB} MB each
          </p>
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isAnalyzing}>
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            data-testid="cv-input"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <ul className="flex-1 space-y-0.5">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
                <button
                  aria-label="Dismiss errors"
                  onClick={() => setErrors([])}
                  className="cursor-pointer rounded p-0.5 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {files.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {files.length} file{files.length > 1 ? "s" : ""} selected
              {files.length >= MAX_FILES && " (limit reached)"}
            </span>
            {!isAnalyzing && (
              <button
                onClick={() => {
                  onFilesChange([]);
                  setErrors([]);
                }}
                className="cursor-pointer font-medium text-slate-500 hover:text-red-600"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {files.map((file) => {
              const key = fileKey(file);
              return (
                <motion.li
                  key={key}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                    <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatSize(file.size)}</span>
                  </span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(key)}
                    disabled={isAnalyzing}
                    className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <AnimatePresence>
          {analyzeError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-center gap-1.5 text-sm font-medium text-red-600"
            >
              <AlertCircle className="h-4 w-4" />
              {analyzeError}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
                <span>{stage}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="lg"
          className="w-full hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          aria-busy={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing {files.length} CV{files.length > 1 ? "s" : ""}…
            </>
          ) : (
            "⚡ Analyze CVs with CVisionAI"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
