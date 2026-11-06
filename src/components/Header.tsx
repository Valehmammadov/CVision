import { ScanSearch, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-[#0b1f3a] text-white shadow-md shadow-blue-600/30">
            <ScanSearch className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-[#0b1f3a]">
              CVision<span className="text-blue-600">AI</span>
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Smart HR Screening for ALAS Academy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            AI Engine Online
          </div>

          {/* Text-based badge: no official ALAS logo is used or imitated */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#0b1f3a] px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>ALAS</span>
            <span className="font-normal text-blue-200">Partner</span>
          </div>
        </div>
      </div>
    </header>
  );
}
