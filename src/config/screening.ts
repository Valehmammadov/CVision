/**
 * CVisionAI screening configuration — change weights, thresholds and limits here.
 */

/** Category weights. Must add up to 1. */
export const CATEGORY_WEIGHTS = {
  technical: 0.35,
  experience: 0.3,
  teaching: 0.2,
  culture: 0.15,
} as const;

export type CategoryKey = keyof typeof CATEGORY_WEIGHTS;

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  technical: "Technical Expertise",
  experience: "Relevant Experience",
  teaching: "Teaching & Mentorship",
  culture: "Culture & Soft Skills",
};

export const CATEGORY_ORDER: CategoryKey[] = ["technical", "experience", "teaching", "culture"];

/**
 * Recommendation thresholds (overall score, 0–100).
 *  >= interview → "Recommend Interview" / High Fit
 *  >= hold      → "Hold" / Moderate Fit
 *  below hold   → "Reject" / Low Fit
 */
export const RECOMMENDATION_THRESHOLDS = {
  interview: 85,
  hold: 70,
} as const;

/** Upload limits. */
export const UPLOAD_LIMITS = {
  maxFiles: 10,
  maxFileSizeMB: 10,
  acceptedExtensions: [".pdf", ".docx"],
};

/** Text shorter than this after extraction is treated as "no readable text". */
export const MIN_EXTRACTED_CHARS = 80;

/** Years of experience assumed when the job description doesn't state any. */
export const DEFAULT_REQUIRED_YEARS = 3;

/** Gemini settings (server-side only). */
export const GEMINI_SETTINGS = {
  defaultModel: "gemini-2.5-flash",
  timeoutMs: 25_000,
  /** CV text sent to the model is truncated to this length. */
  maxCvChars: 20_000,
  maxJobChars: 8_000,
};

/** Online profile verification (server-side). */
export const VERIFY_SETTINGS = {
  githubTimeoutMs: 10_000,
  /** Most recently updated own repos whose package.json is inspected. */
  maxPackageJsonRepos: 10,
  portfolioTimeoutMs: 8_000,
  portfolioMaxBytes: 1_500_000,
  portfolioMaxRedirects: 3,
  /** Cache GitHub results per username to save rate limit (unauthenticated: 60 requests/hour). */
  cacheMinutes: 10,
};

export const DISCLAIMER =
  "CVisionAI provides decision-support insights. Final recruitment decisions should always involve human review.";
