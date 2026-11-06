"use client";

import { Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

export function JobDescription({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
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
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0b1f3a] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="job-desc" className="mb-1 block text-xs font-medium text-slate-500">
            Description
          </label>
          <textarea
            id="job-desc"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </CardContent>
    </Card>
  );
}
