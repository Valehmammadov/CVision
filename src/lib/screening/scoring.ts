import {
  CATEGORY_ORDER,
  CATEGORY_WEIGHTS,
  RECOMMENDATION_THRESHOLDS,
} from "@/config/screening";
import type { EvaluationMetrics, FitLabel, FitLevel, Verdict } from "@/data/candidates";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/** Weighted overall score from the four category scores (0–100, rounded). */
export function weightedScore(metrics: EvaluationMetrics): number {
  const total = CATEGORY_ORDER.reduce(
    (sum, key) => sum + clamp(metrics[key]) * CATEGORY_WEIGHTS[key],
    0
  );
  return Math.round(total);
}

/** Maps an overall score to label / fit level / verdict using the configured thresholds. */
export function classify(score: number): { label: FitLabel; fit: FitLevel; verdict: Verdict } {
  if (score >= RECOMMENDATION_THRESHOLDS.interview)
    return { label: "High Fit", fit: "high", verdict: "Recommend Interview" };
  if (score >= RECOMMENDATION_THRESHOLDS.hold)
    return { label: "Moderate Fit", fit: "moderate", verdict: "Hold" };
  return { label: "Low Fit", fit: "low", verdict: "Reject" };
}
