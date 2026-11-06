"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileWarning, X } from "lucide-react";
import type { ExtractionFailure } from "@/data/candidates";

interface Props {
  failures: ExtractionFailure[];
  onDismiss: () => void;
}

export function ExtractionIssues({ failures, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {failures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
          role="alert"
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <FileWarning className="h-4 w-4" />
                {failures.length} file{failures.length > 1 ? "s" : ""} could not be analyzed
              </p>
              <button
                aria-label="Dismiss file issues"
                onClick={onDismiss}
                className="cursor-pointer rounded p-0.5 text-amber-700 hover:bg-amber-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1.5">
              {failures.map((f) => (
                <li key={f.fileName} className="text-sm text-amber-900">
                  <span className="font-medium">{f.fileName}:</span>{" "}
                  <span className="text-amber-800">{f.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
