"use client";

import { useDeferredValue, useMemo } from "react";
import { AlertTriangle, Target, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDomain, jobTemplate, parseJobProfile } from "@/lib/screening/profiles";

interface Props {
  title: string;
  description: string;
  onUseTemplate: (text: string) => void;
  disabled?: boolean;
}

/** Live preview of how the vacancy will be screened (domain, level, key skills, categories). */
export function ScreeningProfilePreview({ title, description, onUseTemplate, disabled }: Props) {
  const t = useDeferredValue(title);
  const d = useDeferredValue(description);
  const p = useMemo(() => parseJobProfile(t, d), [t, d]);
  const template = p.titleDomain ? jobTemplate(p.titleDomain, p.seniority, t) : null;

  return (
    <div className="space-y-2" data-testid="screening-profile">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-xs text-slate-600">
        <p className="mb-1.5 flex flex-wrap items-center gap-1.5 font-semibold text-navy">
          <Target className="h-3.5 w-3.5 text-blue-600" />
          Screening profile:
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white" data-testid="profile-domain">
            {p.domainLabel}
          </span>
          <span className="rounded-full border border-blue-200 bg-surface px-2 py-0.5 text-[11px] font-medium text-blue-700">
            {p.seniority === "Not specified" ? "Level not specified" : p.seniority} · {p.requiredYears}+ yrs
          </span>
        </p>
        <p>
          <span className="font-medium text-slate-700">Key skills checked:</span>{" "}
          {p.coreSkills.length ? p.coreSkills.join(", ") : "none recognised — add the key skills to the description"}
          {p.coreSkills.length > 0 && !p.coreFromDescription && (
            <span className="text-slate-400"> (defaults for this role)</span>
          )}
        </p>
        <p>
          <span className="font-medium text-slate-700">Scored on:</span> {getDomain(p.domain).id === "general" ? "Skills" : "Technical skills"}{" "}
          35% · Experience 30% · {p.thirdCategoryLabel} 20% · Culture & soft skills 15%
          {p.languages.length > 0 && <> · Languages: {p.languages.join(", ")}</>}
        </p>
      </div>

      {p.mismatch && p.titleDomain && p.descriptionDomain && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900" role="alert" data-testid="profile-mismatch">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              The title looks like a <strong>{getDomain(p.titleDomain).label}</strong> role, but the description lists{" "}
              <strong>{getDomain(p.descriptionDomain).label}</strong> requirements. Screening will use the{" "}
              {getDomain(p.titleDomain).label} profile with default skills. Update the description for more accurate
              results.
            </span>
          </p>
          {template && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-amber-300 bg-surface text-amber-800 hover:bg-amber-100"
              onClick={() => onUseTemplate(template)}
              disabled={disabled}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Use a {getDomain(p.titleDomain).label} description template
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
