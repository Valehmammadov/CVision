"use client";

import { motion } from "framer-motion";
import { Gauge, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RunStats } from "@/data/candidates";

interface Props {
  /** null = no analysis yet, show demo values. */
  stats: RunStats | null;
}

function formatSpeed(s: number) {
  return s < 1 ? `${s.toFixed(2)}s / CV` : `${s.toFixed(1)}s / CV`;
}

export function AnalyticsSummary({ stats }: Props) {
  const cards = [
    {
      label: "Total CVs Screened",
      value: stats ? String(stats.screened) : "3",
      icon: Users,
      tint: "bg-blue-50 text-blue-600",
    },
    {
      label: "Top Match",
      value: stats ? `${stats.topMatch}%` : "94%",
      icon: Trophy,
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      label: stats ? "Avg. Processing Time" : "Processing Speed",
      value: stats ? formatSpeed(stats.secondsPerCv) : "0.8s / CV",
      icon: Gauge,
      tint: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.tint}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <motion.p
                key={s.value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-navy"
                data-testid={`stat-${i}`}
              >
                {s.value}
              </motion.p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {stats
          ? "Measured on this device for the latest analysis, including text extraction."
          : "Illustrative demo metrics — not measured performance."}
      </p>
    </div>
  );
}
