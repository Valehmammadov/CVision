import { Bot, FlaskConical, ListChecks, Sparkles } from "lucide-react";
import type { ResultsMethod } from "@/data/candidates";
import { cn } from "@/lib/utils";

const META: Record<ResultsMethod, { label: string; icon: typeof Bot; className: string }> = {
  demo: {
    label: "Demo data",
    icon: FlaskConical,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "rule-based": {
    label: "Rule-based analysis",
    icon: ListChecks,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  ai: {
    label: "AI-assisted analysis",
    icon: Sparkles,
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  mixed: {
    label: "AI-assisted + rule-based fallback",
    icon: Sparkles,
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

export function MethodBadge({ method, className }: { method: ResultsMethod; className?: string }) {
  const m = META[method];
  return (
    <span
      data-testid="method-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        m.className,
        className
      )}
    >
      <m.icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}
