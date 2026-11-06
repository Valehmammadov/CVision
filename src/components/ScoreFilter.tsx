"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScoreFilterValue = "all" | "gt90" | "70to90" | "lt70";

export const scoreFilterOptions: { value: ScoreFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gt90", label: ">90%" },
  { value: "70to90", label: "70–90%" },
  { value: "lt70", label: "<70%" },
];

/** >90 is strictly greater than 90; 70–90 is inclusive on both ends; <70 is strictly below 70. */
export function matchesScoreFilter(score: number, filter: ScoreFilterValue) {
  switch (filter) {
    case "gt90":
      return score > 90;
    case "70to90":
      return score >= 70 && score <= 90;
    case "lt70":
      return score < 70;
    default:
      return true;
  }
}

interface Props {
  value: ScoreFilterValue;
  onChange: (v: ScoreFilterValue) => void;
}

export function ScoreFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = scoreFilterOptions.find((o) => o.value === value)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openMenu() {
    setActive(scoreFilterOptions.findIndex((o) => o.value === value));
    setOpen(true);
  }

  function choose(v: ScoreFilterValue) {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % scoreFilterOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + scoreFilterOptions.length) % scoreFilterOptions.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(scoreFilterOptions[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <span id="score-filter-label" className="sr-only">
        Filter by Match Score
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="score-filter-label score-filter-value"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border bg-surface px-3 text-sm font-medium text-navy shadow-sm transition-all hover:border-slate-300 sm:w-56",
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
        )}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <span className="text-slate-500">Match:</span>
          <span id="score-filter-value">{current.label}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-labelledby="score-filter-label"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-2 w-full origin-top overflow-hidden rounded-xl border border-slate-200 bg-surface p-1 shadow-lg sm:w-56"
          >
            {scoreFilterOptions.map((opt, i) => {
              const selected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    i === active ? "bg-blue-50 text-blue-700" : "text-slate-700",
                    selected && "font-semibold"
                  )}
                >
                  {opt.label}
                  {selected && <Check className="h-4 w-4 text-blue-600" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
