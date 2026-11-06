"use client";

import { motion } from "framer-motion";
import { Gauge, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    label: "Total CVs Screened",
    value: "3",
    icon: Users,
    tint: "bg-blue-50 text-blue-600",
  },
  {
    label: "Top Match",
    value: "94%",
    icon: Trophy,
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Processing Speed",
    value: "0.8s / CV",
    icon: Gauge,
    tint: "bg-amber-50 text-amber-600",
  },
];

export function AnalyticsSummary() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
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
              <p className="text-2xl font-bold text-[#0b1f3a]">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Illustrative demo metrics — not measured performance.
      </p>
    </div>
  );
}
