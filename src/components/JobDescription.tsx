"use client";

import { AlertCircle, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScreeningProfilePreview } from "@/components/ScreeningProfilePreview";

interface Props {
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function JobDescription({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  error,
  disabled,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <CardTitle>Job Description</CardTitle>
        </div>
        <CardDescription>
          Edit the role details the CVs will be compared against.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label htmlFor="job-title" className="mb-1 block text-xs font-medium text-slate-500">
            Job title
          </label>
          <input
            id="job-title"
            value={title}
            disabled={disabled}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm font-medium text-navy outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="job-desc" className="block text-xs font-medium text-slate-500">
              Description
            </label>
            <span className="text-xs text-slate-400">{description.trim().length} characters</span>
          </div>
          <textarea
            id="job-desc"
            value={description}
            disabled={disabled}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={12}
            aria-invalid={!!error}
            aria-describedby={error ? "job-desc-error" : undefined}
            className={cn(
              "w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm leading-relaxed text-slate-700 outline-none transition focus:ring-2 disabled:opacity-60",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            )}
          />
          {error && (
            <p id="job-desc-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>
        <ScreeningProfilePreview
          title={title}
          description={description}
          onUseTemplate={onDescriptionChange}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
