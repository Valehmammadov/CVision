// Fictional demonstration profiles. Scores below are hard-coded demo values,
// NOT results produced by a real AI model.

export type FitLevel = "high" | "moderate" | "low";

export interface Candidate {
  id: string;
  name: string;
  targetRole: string;
  score: number;
  label: "High Fit" | "Moderate Fit" | "Low Fit";
  fit: FitLevel;
  verdict: "Recommend Interview" | "Hold" | "Reject";
  strengths: string[];
  gaps: string[];
}

export const candidates: Candidate[] = [
  {
    id: "alex-morgan",
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
  },
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    targetRole: "Software Development Instructor",
    score: 72,
    label: "Moderate Fit",
    fit: "moderate",
    verdict: "Hold",
    strengths: [
      "React",
      "JavaScript",
      "Frontend Development",
      "Problem Solving",
    ],
    gaps: ["Only 1 Year Experience", "Limited Node.js", "No Teaching Experience"],
  },
  {
    id: "daniel-rivera",
    name: "Daniel Rivera",
    targetRole: "Software Development Instructor",
    score: 41,
    label: "Low Fit",
    fit: "low",
    verdict: "Reject",
    strengths: ["Digital Marketing", "HTML Basics", "Communication"],
    gaps: [
      "No Node.js",
      "Limited React",
      "No Programming Experience",
      "No Teaching Background",
    ],
  },
];

export const defaultJobTitle = "Software Development Instructor - ALAS Academy";

export const defaultJobDescription = `About the role
ALAS Academy is looking for a Software Development Instructor to teach and mentor students in modern full-stack web development at our Baku campus.

Responsibilities
- Deliver engaging lessons on JavaScript, React and Node.js
- Design hands-on projects, assignments and assessments
- Mentor students and give constructive, actionable feedback
- Keep the curriculum aligned with current industry practices

Requirements
- 2+ years of professional software development experience
- Strong skills in React, Node.js and JavaScript/TypeScript
- Prior teaching, tutoring or mentoring experience
- Fluent English; Azerbaijani is a strong advantage

Nice to have
- Experience with cloud deployment (Vercel, AWS, Docker)
- Experience building curriculum or running workshops`;

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
