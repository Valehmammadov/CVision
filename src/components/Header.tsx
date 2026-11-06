import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface Props {
  /** null while the engine status is loading. */
  geminiReady?: boolean | null;
}

export function Header({ geminiReady = null }: Props) {
  const status =
    geminiReady === null
      ? { text: "Connecting…", tone: "slate" }
      : geminiReady
        ? { text: "AI Engine Online", tone: "emerald" }
        : { text: "Screening Engine Online", tone: "emerald" };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Team logo: navy version for light mode, light version for dark mode */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cvision-logo-light.png"
            alt="CVision"
            width={447}
            height={144}
            className="h-9 w-auto dark:hidden sm:h-10"
            data-testid="logo-light"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cvision-logo-dark.png"
            alt="CVision"
            width={447}
            height={144}
            className="hidden h-9 w-auto dark:block sm:h-10"
            data-testid="logo-dark"
          />
          <p className="hidden border-l border-slate-200 pl-3 text-xs leading-tight text-slate-500 sm:block sm:text-sm">
            Smart HR Screening
            <br />
            for ALAS Academy
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            title={
              geminiReady
                ? "Gemini AI-assisted analysis is available"
                : "Rule-based screening engine (no AI key configured)"
            }
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium",
              status.tone === "emerald"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            )}
          >
            <span className="relative flex h-2 w-2">
              {status.tone === "emerald" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  status.tone === "emerald" ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
            </span>
            {status.text}
          </div>

          {/* Text-based badge: no official ALAS logo is used or imitated */}
          <div className="flex items-center gap-1.5 rounded-full bg-navy-solid px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>ALAS</span>
            <span className="font-normal text-blue-200 dark:text-blue-800">Partner</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
      <p className="px-4 pb-2 text-xs text-slate-500 sm:hidden">Smart HR Screening for ALAS Academy</p>
    </header>
  );
}
