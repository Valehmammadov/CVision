"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCEPTED_EXT = [".pdf", ".docx"];

function isAccepted(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXT.some((ext) => name.endsWith(ext));
}

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
}

export function CVUpload({ files, onFilesChange, onAnalyze }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(0);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const valid = incoming.filter(isAccepted);
    setRejected(incoming.length - valid.length);
    const existing = new Set(files.map((f) => `${f.name}-${f.size}`));
    const fresh = valid.filter((f) => !existing.has(`${f.name}-${f.size}`));
    onFilesChange([...files, ...fresh]);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

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
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50/60 hover:border-blue-400"
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-semibold text-[#0b1f3a]">Drop candidate CVs here</p>
          <p className="mb-4 text-sm text-slate-500">Upload PDF or DOCX files</p>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {rejected > 0 && (
          <p className="text-xs text-red-600">
            {rejected} file{rejected > 1 ? "s were" : " was"} skipped — only PDF
            and DOCX are supported.
          </p>
        )}

        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {files.map((file, i) => (
              <motion.li
                key={`${file.name}-${file.size}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                <button
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(i)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <Button size="lg" className="w-full" onClick={onAnalyze}>
          ⚡ Analyze CVs with CVisionAI
        </Button>
      </CardContent>
    </Card>
  );
}
