import type { CategoryKey } from "@/config/screening";

export type FitLevel = "high" | "moderate" | "low";
export type FitLabel = "High Fit" | "Moderate Fit" | "Low Fit";
export type Verdict = "Recommend Interview" | "Hold" | "Reject";

/** How a candidate's result was produced. */
export type ScreeningMethod = "demo" | "rule-based" | "ai";

/** Method for a whole batch of results ("mixed" = some CVs fell back to rule-based). */
export type ResultsMethod = ScreeningMethod | "mixed";

export interface ExtractionFailure {
  fileName: string;
  reason: string;
}

export interface RunStats {
  screened: number;
  topMatch: number;
  secondsPerCv: number;
}

export type EvaluationMetrics = Record<CategoryKey, number>;

export interface ProfileLinks {
  github?: { username: string; url: string };
  linkedin?: string;
  portfolio: string[];
}

/** Recruiter decision recorded in this session (demo — no emails are sent). */
export type Decision = "invited" | "rejected";

/* ---------- Online verification (real data from /api/verify) ---------- */

export interface RepoEvidence {
  repo: string;
  url: string;
  how: string; // e.g. "language: TypeScript", "package.json: react"
}

export interface SkillCheck {
  skill: string;
  verified: boolean;
  /** false when GitHub can't show evidence for this skill (e.g. Docker, cloud, REST APIs). */
  checkable: boolean;
  evidence: RepoEvidence[];
}

export interface GithubVerification {
  status: "ok" | "error";
  error?: string;
  username?: string;
  profileUrl?: string;
  name?: string | null;
  avatarUrl?: string;
  publicRepos?: number;
  followers?: number;
  createdAt?: string;
  lastPushAt?: string | null;
  ownReposAnalyzed?: number;
  forksIgnored?: number;
  topLanguages?: { language: string; repos: number }[];
  skills?: SkillCheck[];
}

export interface PortfolioVerification {
  status: "ok" | "error";
  url: string;
  error?: string;
  finalUrl?: string;
  httpStatus?: number;
  title?: string | null;
  skillsMentioned?: string[];
}

export interface VerificationResult {
  checkedAt: string;
  claimedSkills: string[];
  github?: GithubVerification;
  portfolio?: PortfolioVerification;
}

export interface Candidate {
  id: string;
  name: string;
  targetRole: string;
  /** Weighted overall score, 0–100. */
  score: number;
  label: FitLabel;
  fit: FitLevel;
  verdict: Verdict;
  strengths: string[];
  gaps: string[];
  /** Category scores, 0–100. */
  metrics: EvaluationMetrics;
  evaluation: string;
  method: ScreeningMethod;
  fileName?: string;
  yearsExperience?: number | null;
  /** Evidence lines explaining each category score. */
  evidence?: Partial<Record<CategoryKey, string[]>>;
  /** e.g. why AI analysis fell back to rule-based. */
  methodNote?: string;
  /** Category labels for this role (the third category depends on the job). */
  categoryLabels?: Record<CategoryKey, string>;
  /** e.g. "Cybersecurity · Junior" — the role profile the CV was screened against. */
  screeningProfile?: string;
  /** Technologies the CV claims (used for online verification). */
  claimedSkills?: string[];
  /** Public profile links found in the CV. */
  profiles?: ProfileLinks;
}

/**
 * Fictional demonstration profiles shown before any CVs are analyzed.
 * Category scores are hand-picked demo values; overall = weighted sum.
 */
export const demoCandidates: Candidate[] = [
  {
    id: "demo-alex-morgan",
    name: "Alex Morgan",
    targetRole: "Software Development Instructor",
    score: 94,
    label: "High Fit",
    fit: "high",
    verdict: "Recommend Interview",
    strengths: [
      "React",
      "Node.js",
      "JavaScript",
      "4 Years Experience",
      "Teaching",
      "Mentorship",
      "Azerbaijani",
      "English",
    ],
    gaps: ["Limited cloud deployment experience"],
    metrics: { technical: 97, experience: 95, teaching: 88, culture: 92 },
    evaluation:
      "Strong full-stack profile that covers the core React, Node.js and JavaScript requirements, backed by four years of hands-on work. Prior teaching and mentoring experience and fluency in both Azerbaijani and English make Alex a natural fit for ALAS Academy's classroom. Cloud deployment is the only notable gap and could be covered with onboarding.",
    method: "demo",
  },
  {
    id: "demo-sarah-chen",
    name: "Sarah Chen",
    targetRole: "Software Development Instructor",
    score: 72,
    label: "Moderate Fit",
    fit: "moderate",
    verdict: "Hold",
    strengths: ["React", "JavaScript", "Frontend Development", "Problem Solving"],
    gaps: ["Only 1 Year Experience", "Limited Node.js", "No Teaching Experience"],
    metrics: { technical: 84, experience: 66, teaching: 50, culture: 85 },
    evaluation:
      "Solid frontend skills in React and JavaScript with good problem-solving ability. However, Sarah has only one year of experience, limited backend (Node.js) exposure and no teaching background, which are central to this instructor role. Worth keeping on hold as a possible teaching assistant or for a future junior opening.",
    method: "demo",
  },
  {
    id: "demo-daniel-rivera",
    name: "Daniel Rivera",
    targetRole: "Software Development Instructor",
    score: 41,
    label: "Low Fit",
    fit: "low",
    verdict: "Reject",
    strengths: ["Digital Marketing", "HTML Basics", "Communication"],
    gaps: ["No Node.js", "Limited React", "No Programming Experience", "No Teaching Background"],
    metrics: { technical: 35, experience: 30, teaching: 40, culture: 80 },
    evaluation:
      "Daniel brings good communication skills and a digital marketing background, but the profile lacks the programming depth this role requires. There is no Node.js experience, only basic HTML and limited React knowledge, and no teaching background. Not a match for the Software Development Instructor position.",
    method: "demo",
  },
];

export const defaultJobTitle = "Software Development Instructor - ALAS Academy";

export const defaultJobDescription = `Software Development Instructor — ALAS Academy, Baku

Responsibilities and requirements:
- Teach software development concepts and practical programming skills.
- Strong experience with JavaScript, React, and Node.js.
- Minimum 3 years of relevant professional experience.
- Ability to mentor students and explain complex technical topics.
- Excellent communication and teaching mindset.
- Fluency in Azerbaijani and English.`;

export const fitStyles: Record<
  FitLevel,
  { text: string; bg: string; bar: string; ring: string; hex: string }
> = {
  high: {
    text: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
    ring: "ring-emerald-100",
    hex: "#10b981",
  },
  moderate: {
    text: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    bar: "bg-amber-500",
    ring: "ring-amber-100",
    hex: "#f59e0b",
  },
  low: {
    text: "text-red-700",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-500",
    ring: "ring-red-100",
    hex: "#ef4444",
  },
};
