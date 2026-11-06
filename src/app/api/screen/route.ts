/**
 * POST /api/screen — scores extracted CV text against the job description.
 * Uses Gemini when GEMINI_API_KEY is set; otherwise (or on any Gemini failure)
 * falls back to the deterministic rule-based engine. Never fabricates results.
 *
 * GET /api/screen — reports which engine is available (no secrets).
 */
import { GEMINI_SETTINGS, UPLOAD_LIMITS } from "@/config/screening";
import type { Candidate } from "@/data/candidates";
import { evaluateWithGemini, geminiConfigured, GeminiError } from "@/lib/screening/gemini";
import { screenCvRuleBased } from "@/lib/screening/ruleEngine";

const MAX_CV_CHARS = 60_000;

interface ScreenRequest {
  jobTitle: string;
  jobDescription: string;
  cvs: { id: string; fileName: string; text: string }[];
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function parseBody(body: unknown): ScreenRequest | string {
  if (!body || typeof body !== "object") return "Invalid request body.";
  const b = body as Record<string, unknown>;
  if (typeof b.jobDescription !== "string" || !b.jobDescription.trim())
    return "Job description is required.";
  if (b.jobDescription.length > 20_000) return "Job description is too long.";
  if (!Array.isArray(b.cvs) || b.cvs.length === 0) return "At least one CV is required.";
  if (b.cvs.length > UPLOAD_LIMITS.maxFiles) return `At most ${UPLOAD_LIMITS.maxFiles} CVs per request.`;
  const cvs: ScreenRequest["cvs"] = [];
  for (const cv of b.cvs) {
    if (!cv || typeof cv !== "object") return "Invalid CV entry.";
    const c = cv as Record<string, unknown>;
    if (typeof c.id !== "string" || typeof c.fileName !== "string" || typeof c.text !== "string")
      return "Invalid CV entry.";
    if (!c.text.trim()) return `CV "${c.fileName}" has no text.`;
    cvs.push({ id: c.id.slice(0, 100), fileName: c.fileName.slice(0, 200), text: c.text.slice(0, MAX_CV_CHARS) });
  }
  return {
    jobTitle: typeof b.jobTitle === "string" ? b.jobTitle.slice(0, 200) : "",
    jobDescription: b.jobDescription,
    cvs,
  };
}

export async function GET() {
  return Response.json({
    geminiConfigured: geminiConfigured(),
    model: geminiConfigured() ? process.env.GEMINI_MODEL?.trim() || GEMINI_SETTINGS.defaultModel : null,
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }
  const parsed = parseBody(json);
  if (typeof parsed === "string") return badRequest(parsed);
  const { jobTitle, jobDescription, cvs } = parsed;

  const useGemini = geminiConfigured();

  const results: Candidate[] = await Promise.all(
    cvs.map(async (cv) => {
      const ruleResult = screenCvRuleBased({ ...cv, jobTitle, jobDescription });
      if (!useGemini) return ruleResult;
      try {
        const aiResult = await evaluateWithGemini({
          ...cv,
          jobTitle,
          jobDescription,
          fallbackName: ruleResult.name,
          targetRole: ruleResult.targetRole,
        });
        return { ...aiResult, claimedSkills: ruleResult.claimedSkills };
      } catch (err) {
        const reason = err instanceof GeminiError ? err.message : "unexpected error";
        console.warn(`[screen] Gemini failed for ${cv.fileName}: ${reason}`);
        return {
          ...ruleResult,
          methodNote: `AI analysis unavailable (${reason}). Rule-based scoring was used instead.`,
        };
      }
    })
  );

  const aiCount = results.filter((r) => r.method === "ai").length;
  const method = aiCount === 0 ? "rule-based" : aiCount === results.length ? "ai" : "mixed";

  return Response.json({
    method,
    geminiConfigured: useGemini,
    candidates: results.sort((a, b) => b.score - a.score),
  });
}
