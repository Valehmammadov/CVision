/**
 * Deterministic, explainable rule-based CV screening.
 *
 * Principles
 * - A single mention never earns full marks: evidence has diminishing returns,
 *   and skills used in work experience/projects score higher than skills that are only listed.
 * - Mentions qualified as "basic", "beginner", "familiar with"… count as weak evidence.
 * - Negated mentions ("no teaching experience") are ignored.
 * - Requirements are read from the job title + description via a role profile (see profiles.ts):
 *   domain (software, cybersecurity, data, devops, design, marketing), core skills, seniority/years,
 *   and whether the role involves teaching (otherwise certifications & learning are scored).
 *
 * Limitations
 * - It reads keywords and simple patterns (e.g. date ranges); it cannot judge depth or quality.
 * - Unusual layouts, tables or multi-column PDFs can be extracted in a confusing order.
 * - Synonyms it doesn't know are missed, and CVs that stuff keywords can be over-scored.
 */
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/config/screening";
import type { Candidate, EvaluationMetrics } from "@/data/candidates";
import { classify, weightedScore } from "./scoring";
import { ALL_SKILL_NAMES, SKILLS, getDomain, parseJobProfile, type Domain, type JobProfile } from "./profiles";

export { parseJobProfile };

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

interface SkillDef {
  name: string;
  pattern: RegExp;
}

const skillDef = (name: string): SkillDef => ({ name, pattern: SKILLS[name] });

/** Names of all skills the scorer knows about (also used for verification). */
export const TECH_SKILL_NAMES = ALL_SKILL_NAMES;

/** Skills mentioned in a text (non-negated), in dictionary order. */
export function detectClaimedSkills(text: string): string[] {
  return ALL_SKILL_NAMES.filter((n) => findMentions(text, SKILLS[n]).length > 0);
}

const LANGUAGES: SkillDef[] = [
  { name: "Azerbaijani", pattern: /\bazerbaijani\b|\bazeri\b|\bazərbaycan(?:\s+dili)?\b/gi },
  { name: "English", pattern: /\benglish\b/gi },
  { name: "Russian", pattern: /\brussian\b/gi },
  { name: "Turkish", pattern: /\bturkish\b/gi },
];

const WEAK_QUALIFIER =
  /\b(basic|basics|beginner|elementary|familiar(?:ity)?|exposure|introductory|learning|limited|some knowledge|currently studying)\b/i;
const NEGATION_BEFORE = /\b(no|not|without|lack(?:ing)?|never|none)\b[^.\n]{0,25}$/i;

const TEACH_ROLE =
  /\b(instructor|teacher|lecturer|tutor|trainer|teaching assistant|educator|professor|bootcamp coach)\b/i;
const TEACH_ROLE_G = new RegExp(TEACH_ROLE.source, "gi");
const TEACH_ACTIVITY =
  /\bteach(?:ing|es)?\b|\btaught\b|\blectur(?:ed|es|ing)\b|\bcurriculum\b|\bworkshops?\b|\blessons?\b|\bclassroom\b|\bstudents\b|\bexplain(?:ed|ing)? (?:complex|technical)\b/gi;
const MENTORSHIP =
  /\bmentor(?:ed|ing|ship|s)?\b|\bcoach(?:ed|ing)\b|\bonboard(?:ed|ing)? (?:new|junior)|\bguided (?:junior|new|students|interns)|\bsupervis(?:ed|ing) (?:junior|interns?)/gi;

const INTERN_ROLE = /\b(intern|internship|trainee)\b/i;
const KNOWLEDGE_SHARING =
  /\bmentor(?:ed|ing|ship|s)?\b|\bconference talks?\b|\bspoke at\b|\bpublished\b|\btech(?:nical)? blog\b|\bopen[- ]source contribut\w*|\bwrote (?:articles|write-?ups)\b|\bwrite-?ups?\b/gi;

const COMMUNICATION =
  /\bcommunicat(?:ion|ive|or)\b|\bpresentations?\b|\bpublic speaking\b|\bpresented\b|\binterpersonal\b|\bstorytelling\b/gi;
const COLLABORATION =
  /\bteam ?work\b|\bteam player\b|\bcollaborat(?:e|ed|ion|ive|ively)\b|\bcross-functional\b|\bproblem[- ]solving\b|\bleadership\b|\bled (?:a|the) team\b|\badaptab(?:le|ility)\b|\bagile\b|\bscrum\b|\bstakeholders?\b/gi;

const SECTION_HEADERS =
  /^(?:work |professional |employment |relevant |teaching )?(experience|employment(?: history)?|work history|career(?: history)?|education|skills|technical skills|core skills|languages?|certifications?|projects?|summary|profile|about me|interests|hobbies|references|courses|awards|volunteer(?:ing)?|achievements|contact)\s*:?$/i;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STEP = [0, 0.6, 0.85, 1];
const stepped = (n: number) => STEP[Math.min(n, 3)];
const round = (n: number) => Math.round(n);

interface Mention {
  index: number;
  line: string;
  weak: boolean;
}

function lineAt(text: string, index: number) {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const endIdx = text.indexOf("\n", index);
  return text.slice(start, endIdx === -1 ? text.length : endIdx);
}

/** All non-negated mentions of a pattern, flagged weak when qualified (e.g. "basic"). */
function findMentions(text: string, pattern: RegExp): Mention[] {
  const out: Mention[] = [];
  pattern.lastIndex = 0;
  for (const m of text.matchAll(pattern)) {
    const idx = m.index ?? 0;
    const lineStart = text.lastIndexOf("\n", idx - 1) + 1;
    const before = text.slice(lineStart, idx);
    if (NEGATION_BEFORE.test(before)) continue;
    const line = lineAt(text, idx);
    out.push({ index: idx, line, weak: WEAK_QUALIFIER.test(line) });
  }
  return out;
}

interface Section {
  name: string;
  start: number;
  end: number;
}

function findSections(text: string): Section[] {
  const sections: Section[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const m = trimmed.length <= 40 ? trimmed.match(SECTION_HEADERS) : null;
    if (m) {
      if (sections.length) sections[sections.length - 1].end = offset;
      sections.push({ name: m[1].toLowerCase(), start: offset, end: text.length });
    }
    offset += line.length + 1;
  }
  return sections;
}

const isWorkSection = (s: Section) => /experience|employment|work|career/.test(s.name);
const inSections = (idx: number, sections: Section[]) =>
  sections.some((s) => idx >= s.start && idx < s.end);

/* ------------------------------------------------------------------ */
/* Years of experience                                                 */
/* ------------------------------------------------------------------ */

const DATE_RANGE = new RegExp(
  String.raw`(?:(\d{1,2})[/.]|(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})` +
    String.raw`\s*(?:-|–|—|to|until)\s*` +
    String.raw`(?:(?:(\d{1,2})[/.]|(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})|(present|current|now|today|ongoing))`,
  "gi"
);

function monthIndex(num?: string, name?: string, fallback = 0) {
  if (num) return Math.min(11, Math.max(0, parseInt(num, 10) - 1));
  if (name) return MONTHS[name.toLowerCase().slice(0, name.toLowerCase().startsWith("sept") ? 4 : 3)] ?? fallback;
  return fallback;
}

function mergedMonths(ranges: [number, number][]) {
  const sorted = ranges.filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const r of sorted) {
    if (!cur || r[0] > cur[1]) {
      if (cur) total += cur[1] - cur[0];
      cur = [r[0], r[1]];
    } else cur[1] = Math.max(cur[1], r[1]);
  }
  if (cur) total += cur[1] - cur[0];
  return total;
}

interface YearsResult {
  relevantYears: number;
  totalYears: number;
  domainRoles: number;
  teachRoles: number;
  evidence: string[];
}

function analyzeExperience(text: string, sections: Section[], domain: Domain): YearsResult {
  const workSections = sections.filter(isWorkSection);
  const lines = text.split("\n");
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();

  // Line offsets for section membership.
  const offsets: number[] = [];
  let off = 0;
  for (const l of lines) {
    offsets.push(off);
    off += l.length + 1;
  }
  const lineInScope = (i: number) =>
    workSections.length
      ? inSections(offsets[i], workSections)
      : !/\b(university|bachelor|master|degree|school|college|b\.?sc|m\.?sc|diploma|education)\b/i.test(lines[i]);

  const allRanges: [number, number][] = [];
  const relevantRanges: [number, number][] = [];
  const evidence: string[] = [];
  const devRoleLines = new Set<number>();
  const teachRoleLines = new Set<number>();

  // Nearest non-empty neighbours (DOCX/PDF extraction often inserts blank lines between a title and its dates).
  const nonEmpty = lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i >= 0);
  const neighbours = (i: number) => {
    const pos = nonEmpty.indexOf(i);
    return [nonEmpty[pos - 2], nonEmpty[pos - 1], nonEmpty[pos + 1]]
      .filter((j) => j !== undefined)
      .map((j) => lines[j as number]);
  };

  lines.forEach((line, i) => {
    if (!lineInScope(i) || !line.trim()) return;
    const window = [...neighbours(i), line].join(" ");
    // Relevant = a role title from this domain, an internship in this domain, or teaching this domain.
    // Internship / teaching roles need the domain context on the title or date line itself.
    const pos = nonEmpty.indexOf(i);
    const near = [lines[nonEmpty[pos - 1]] ?? "", line].join(" ");
    const isDev = domain.roles.test(window) || (INTERN_ROLE.test(near) && domain.context.test(near));
    const isTeachTech = TEACH_ROLE.test(near) && domain.context.test(near);

    DATE_RANGE.lastIndex = 0;
    for (const m of line.matchAll(DATE_RANGE)) {
      const start = parseInt(m[3], 10) * 12 + monthIndex(m[1], m[2], 0);
      const end = m[7] ? nowIdx : parseInt(m[6], 10) * 12 + monthIndex(m[4], m[5], 0);
      if (end <= start || end - start > 40 * 12) continue;
      allRanges.push([start, end]);
      if (isDev || isTeachTech) {
        relevantRanges.push([start, end]);
        if (isDev) devRoleLines.add(i);
        if (isTeachTech) teachRoleLines.add(i);
      }
    }
  });

  // Explicit statements: "4+ years of experience in web development"
  let statedRelevant = 0;
  let statedTotal = 0;
  const STATED = /(\d{1,2}(?:[.,]\d)?)\s*\+?\s*(?:years?|yrs?)\b/gi;
  for (const m of text.matchAll(STATED)) {
    const line = lineAt(text, m.index ?? 0);
    if (!/experience|worked|working|career/i.test(line)) continue;
    if (/\b(less than|under)\s*$/i.test(text.slice(Math.max(0, (m.index ?? 0) - 12), m.index))) continue;
    const yrs = parseFloat(m[1].replace(",", "."));
    if (!(yrs > 0 && yrs <= 40)) continue;
    statedTotal = Math.max(statedTotal, yrs);
    if (domain.roles.test(line) || domain.context.test(line)) statedRelevant = Math.max(statedRelevant, yrs);
  }

  const rangeRelevant = mergedMonths(relevantRanges) / 12;
  const rangeTotal = mergedMonths(allRanges) / 12;
  const relevantYears = Math.round(Math.max(rangeRelevant, statedRelevant) * 10) / 10;
  const totalYears = Math.round(Math.max(rangeTotal, statedTotal, relevantYears) * 10) / 10;

  if (relevantRanges.length)
    evidence.push(`Relevant role dates found: ~${rangeRelevant.toFixed(1)} years (overlaps merged)`);
  if (statedRelevant) evidence.push(`Stated relevant experience: ${statedRelevant} years`);
  if (!relevantRanges.length && !statedRelevant && totalYears > 0)
    evidence.push(`~${totalYears} years of experience found, but not in ${domain.label} roles`);

  return {
    relevantYears,
    totalYears,
    domainRoles: devRoleLines.size,
    teachRoles: teachRoleLines.size,
    evidence,
  };
}

/* ------------------------------------------------------------------ */
/* Name                                                                */
/* ------------------------------------------------------------------ */

const NAME_STOPWORDS =
  /\b(curriculum|vitae|resume|résumé|cv|profile|summary|contact|phone|email|address|developer|engineer|instructor|teacher|manager|specialist|marketer|marketing|designer|consultant|intern|student|analyst|frontend|backend|full|stack|software|web|senior|junior|lead|experience|education|skills|security|cybersecurity|cyber|data|scientist|devops|administrator|technician|officer|coordinator|executive)\b/i;
const NAME_WORD = /^[\p{Lu}][\p{L}'’-]*\.?$/u;

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
}

export function extractName(text: string, fileName: string): string {
  const labeled = text.match(/^\s*(?:full\s+)?name\s*[:\-]\s*([^\n]{3,60})$/im);
  if (labeled) return titleCase(labeled[1].trim());

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  for (const raw of lines) {
    // Split off "Name | Title" or "Name — Title" headers.
    const line = raw.split(/\s[|•·—–-]\s|\t/)[0].trim();
    if (line.length > 40 || /[@\d:/]/.test(line) || NAME_STOPWORDS.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 4) continue;
    const allCaps = line === line.toUpperCase();
    const candidate = allCaps ? titleCase(line) : line;
    if (candidate.split(/\s+/).every((w) => NAME_WORD.test(w))) return candidate;
  }

  const fromFile = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\b(cv|resume|résumé|curriculum|vitae|final|updated|v\d+|\d{4})\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return fromFile ? titleCase(fromFile) : "Unnamed candidate";
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

interface SkillResult {
  name: string;
  strength: number; // 0–1
  strong: number;
  weak: number;
  inWork: boolean;
}

function assessSkill(text: string, def: SkillDef, workSections: Section[]): SkillResult {
  const mentions = findMentions(text, def.pattern);
  const strong = mentions.filter((m) => !m.weak);
  const weak = mentions.length - strong.length;
  const inWork = strong.some((m) => inSections(m.index, workSections));
  let strength: number;
  if (strong.length === 0) strength = weak > 0 ? 0.3 : 0;
  else {
    // 1 mention 0.45 → 2: 0.65 → 3: 0.8 → 4+: 0.9, +0.1 if used in work experience/projects
    strength = [0, 0.45, 0.65, 0.8, 0.9][Math.min(strong.length, 4)];
    if (inWork) strength = Math.min(1, strength + 0.1);
  }
  return { name: def.name, strength, strong: strong.length, weak, inWork };
}

function languageLevel(text: string, def: SkillDef): { level: number; label: string } {
  const mentions = findMentions(text, def.pattern);
  if (!mentions.length) return { level: 0, label: "not mentioned" };
  // A stated level (e.g. "English — B1") takes precedence over plain mentions elsewhere in the CV.
  let best: { level: number; label: string } | null = null;
  for (const m of mentions) {
    // Only look at the text right after the language name, so "Azerbaijani — native, English — B1" isn't mixed up.
    const after = m.line.slice(m.line.toLowerCase().indexOf(def.name.toLowerCase().slice(0, 5))).toLowerCase();
    const l = after.split(/[,;|]/)[0] + " " + after.slice(0, 40);
    let cur: { level: number; label: string } | null = null;
    if (/\b(native|mother tongue|fluent|fluency|bilingual|c2|c1|advanced|proficient|professional working)\b/.test(l))
      cur = { level: 1, label: "fluent/native" };
    else if (/\b(upper[- ]intermediate|b2)\b/.test(l)) cur = { level: 0.75, label: "upper-intermediate" };
    else if (/\b(intermediate|b1|conversational)\b/.test(l)) cur = { level: 0.6, label: "intermediate" };
    else if (/\b(basic|elementary|beginner|a1|a2)\b/.test(l)) cur = { level: 0.3, label: "basic" };
    if (cur && (!best || cur.level > best.level)) best = cur;
  }
  return best ?? { level: 0.7, label: "mentioned (level not stated)" };
}

function countMatches(text: string, pattern: RegExp) {
  return findMentions(text, pattern).length;
}

function fmtYears(y: number) {
  const r = Math.round(y * 10) / 10;
  return `${Number.isInteger(r) ? r : r.toFixed(1)} year${r === 1 ? "" : "s"}`;
}

export interface RuleInput {
  id: string;
  fileName: string;
  text: string;
  jobTitle: string;
  jobDescription: string;
}

export function screenCvRuleBased(input: RuleInput): Candidate {
  const { text, fileName, jobDescription, jobTitle } = input;
  const req: JobProfile = parseJobProfile(jobTitle, jobDescription);
  const domain = getDomain(req.domain);
  const sections = findSections(text);
  const workSections = sections.filter((s) => isWorkSection(s) || s.name.startsWith("project"));

  /* ---------- Technical (core skills 80 + supporting skills 20) ---------- */
  const core = req.coreSkills.map((name) => assessSkill(text, skillDef(name), workSections));
  const others = domain.skills.filter((n) => !req.coreSkills.includes(n)).map((n) => assessSkill(text, skillDef(n), workSections));
  const extras = others.filter((s) => s.strong > 0);
  const extraPts = Math.min(20, extras.length * 5);
  let technical: number;
  const techEvidence: string[] = [];
  if (core.length) {
    const coreAvg = core.reduce((s, c) => s + c.strength, 0) / core.length;
    technical = round(coreAvg * 80 + extraPts);
    techEvidence.push(
      `Core ${domain.label} skills (80 pts)${req.coreFromDescription ? " from the job description" : " — defaults for this role"}: ${req.coreSkills.join(", ")}`
    );
  } else {
    // General role with no recognisable skills in the description: use breadth of known skills.
    technical = round(Math.min(100, extras.length * 15));
    techEvidence.push("No specific skills recognised in the job description — scored on breadth of known skills found");
  }
  for (const c of core) {
    techEvidence.push(
      c.strength === 0
        ? `${c.name}: not found → 0%`
        : c.strong === 0
          ? `${c.name}: only basic/limited mentions → ${round(c.strength * 100)}%`
          : `${c.name}: ${c.strong} mention${c.strong > 1 ? "s" : ""}${c.inWork ? ", used in work/projects" : ", listed only"} → ${round(c.strength * 100)}%`
    );
  }
  if (core.length)
    techEvidence.push(
      extras.length
        ? `Supporting ${domain.label} skills: ${extras.map((e) => e.name).join(", ")} → +${extraPts}/20`
        : "No supporting skills for this role found → +0/20"
    );
  const weakExtras = others.filter((s) => s.strong === 0 && s.weak > 0);
  if (weakExtras.length)
    techEvidence.push(`Basic/limited only (not counted): ${weakExtras.map((e) => e.name).join(", ")}`);

  /* ---------- Experience (years 70 + relevant roles 30) ---------- */
  const exp = analyzeExperience(text, sections, domain);
  const yearsRatio =
    req.requiredYears <= 0 ? (exp.relevantYears > 0 ? 1 : 0.5) : Math.min(1, exp.relevantYears / req.requiredYears);
  const yearsPts = 70 * yearsRatio;
  const roles = exp.domainRoles + exp.teachRoles;
  const rolePts = 30 * stepped(roles);
  const experience = round(yearsPts + rolePts);
  const expEvidence = [
    `Required: ${req.requiredYears}+ years (${req.yearsStated ? "stated in the description" : `${req.seniority.toLowerCase()} level`}); relevant ${domain.label} experience detected: ${fmtYears(exp.relevantYears)} → ${round(yearsPts)}/70`,
    `Relevant dated roles found: ${roles} → ${round(rolePts)}/30`,
    ...exp.evidence,
  ];

  /* ---------- Third category: Teaching & Mentorship OR Certifications & Learning ---------- */
  let teaching: number;
  let teachEvidence: string[];
  let teachRoleMentions = 0;
  let teachActs = 0;
  let mentorN = 0;
  let certNames: string[] = [];
  let learnN = 0;
  let shareN = 0;
  if (req.teachingRole) {
    // roles 45 + activities 25 + mentoring 30
    teachRoleMentions = findMentions(text, TEACH_ROLE_G).filter(
      (m) => domain.context.test(m.line) || exp.teachRoles > 0
    ).length;
    teachActs = countMatches(text, TEACH_ACTIVITY);
    mentorN = countMatches(text, MENTORSHIP);
    const teachRolePts = 45 * stepped(teachRoleMentions);
    const teachActPts = 25 * stepped(teachActs);
    const mentorPts = 30 * stepped(mentorN);
    teaching = round(teachRolePts + teachActPts + mentorPts);
    teachEvidence = [
      `Teaching roles (instructor, tutor, trainer…): ${teachRoleMentions} → ${round(teachRolePts)}/45`,
      `Teaching activities (taught, curriculum, workshops, students…): ${teachActs} → ${round(teachActPts)}/25`,
      `Mentorship (mentored, coached, onboarded juniors…): ${mentorN} → ${round(mentorPts)}/30`,
    ];
  } else {
    // certifications 50 + continuous learning 30 + knowledge sharing 20
    certNames = [...new Set(findMentions(text, domain.certs).map((m) => text.slice(m.index).match(domain.certs)?.[0] ?? ""))]
      .map((c) => c.trim())
      .filter(Boolean);
    certNames = [...new Set(certNames.map((c) => c.toUpperCase()))];
    learnN = countMatches(text, domain.learning);
    shareN = countMatches(text, KNOWLEDGE_SHARING);
    const certPts = 50 * stepped(certNames.length);
    const learnPts = 30 * stepped(learnN);
    const sharePts = 20 * stepped(shareN);
    teaching = round(certPts + learnPts + sharePts);
    teachEvidence = [
      `${domain.label} certifications: ${certNames.length ? certNames.join(", ") : "none found"} → ${round(certPts)}/50`,
      `Continuous learning (courses, labs, bootcamps${req.domain === "cybersecurity" ? ", CTFs" : ""}…): ${learnN} → ${round(learnPts)}/30`,
      `Knowledge sharing (mentoring, talks, write-ups, open source): ${shareN} → ${round(sharePts)}/20`,
    ];
  }

  /* ---------- Culture & soft skills (languages 50 + communication 25 + collaboration 25) ---------- */
  const langs = req.languages.map((name) => ({
    name,
    ...languageLevel(text, LANGUAGES.find((l) => l.name === name)!),
  }));
  const commN = countMatches(text, COMMUNICATION);
  const collabN = countMatches(text, COLLABORATION);
  let culture: number;
  const cultureEvidence: string[] = [];
  if (langs.length) {
    const langPts = (50 * langs.reduce((s, l) => s + l.level, 0)) / langs.length;
    const commPts = 25 * stepped(commN);
    const collabPts = 25 * stepped(collabN);
    culture = round(langPts + commPts + collabPts);
    cultureEvidence.push(
      `Required languages (50 pts): ${langs.map((l) => `${l.name} ${l.label}`).join("; ")} → ${round(langPts)}/50`,
      `Communication evidence: ${commN} → ${round(commPts)}/25`,
      `Teamwork / problem-solving / leadership: ${collabN} → ${round(collabPts)}/25`
    );
  } else {
    const commPts = 50 * stepped(commN);
    const collabPts = 50 * stepped(collabN);
    culture = round(commPts + collabPts);
    cultureEvidence.push(
      "No language requirement found in the job description",
      `Communication evidence: ${commN} → ${round(commPts)}/50`,
      `Teamwork / problem-solving / leadership: ${collabN} → ${round(collabPts)}/50`
    );
  }

  const metrics: EvaluationMetrics = { technical, experience, teaching, culture };
  const score = weightedScore(metrics);
  const cls = classify(score);

  /* ---------- Strengths & gaps ---------- */
  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const c of core) {
    if (c.strength >= 0.65) strengths.push(c.name);
    else if (c.strength === 0) gaps.push(`No ${c.name} found`);
    else gaps.push(`Limited ${c.name}`);
  }
  extras
    .filter((e) => e.strength >= 0.55)
    .slice(0, 2)
    .forEach((e) => strengths.push(e.name));
  if (exp.relevantYears >= 1) strengths.push(`${fmtYears(exp.relevantYears)} relevant experience`);
  if (exp.relevantYears < req.requiredYears)
    gaps.push(
      exp.relevantYears === 0
        ? `No relevant ${domain.label} experience found`
        : `${fmtYears(exp.relevantYears)} experience (${req.requiredYears}+ required)`
    );
  if (req.teachingRole) {
    if (teachRoleMentions > 0) strengths.push("Teaching experience");
    else if (teachActs > 0) gaps.push("Limited formal teaching experience");
    else gaps.push("No teaching experience found");
    if (mentorN > 0) strengths.push("Mentorship");
    else gaps.push("No mentorship evidence");
  } else {
    if (certNames.length) strengths.push(...certNames.slice(0, 3).map((c) => `${c} certified`));
    else gaps.push(`No ${domain.label} certifications found`);
    if (learnN > 0) strengths.push("Continuous learning");
  }
  for (const l of langs) {
    if (l.level >= 0.7) strengths.push(l.name);
    else if (l.level === 0) gaps.push(`${l.name} not mentioned`);
    else gaps.push(`${l.name} (${l.label})`);
  }
  if (commN > 0) strengths.push("Communication");
  else gaps.push("Communication skills not evidenced");

  /* ---------- Explanation ---------- */
  const has = core.filter((c) => c.strength >= 0.65).map((c) => c.name);
  const lacking = core.filter((c) => c.strength < 0.65).map((c) => c.name);
  const sentences: string[] = [];
  if (!core.length) sentences.push("The job description names no recognisable skills, so the technical score reflects general skill breadth.");
  else if (technical >= 80) sentences.push(`Strong ${domain.label} match with solid evidence of ${has.join(", ")}.`);
  else if (has.length)
    sentences.push(
      `Partial ${domain.label} match: good evidence of ${has.join(", ")}, but ${lacking.join(", ")} ${lacking.length > 1 ? "are" : "is"} limited or missing.`
    );
  else sentences.push(`Weak ${domain.label} match — little evidence of ${req.coreSkills.join(", ")}.`);

  sentences.push(
    exp.relevantYears > 0
      ? `About ${fmtYears(exp.relevantYears)} of relevant experience against ${req.requiredYears}+ required.`
      : exp.totalYears > 0
        ? `Has about ${fmtYears(exp.totalYears)} of work experience, but not in ${domain.label} roles.`
        : "No clearly dated relevant work experience was found."
  );
  if (req.teachingRole)
    sentences.push(
      teachRoleMentions > 0
        ? `Direct teaching experience${mentorN ? " and mentoring" : ""} supports the instructor role.`
        : teachActs + mentorN > 0
          ? "Some mentoring or teaching activity, but no formal teaching role."
          : "No teaching or mentoring evidence, which is central to this role."
    );
  else
    sentences.push(
      certNames.length
        ? `Holds relevant certifications (${certNames.join(", ")}).`
        : learnN > 0
          ? "No industry certifications, but shows continuous learning."
          : "No certifications or continuous-learning evidence found."
    );
  if (langs.length) {
    const missing = langs.filter((l) => l.level < 0.7).map((l) => l.name);
    sentences.push(
      missing.length
        ? `Language requirements not fully evidenced (${missing.join(", ")}).`
        : `Meets the language requirements (${langs.map((l) => l.name).join(", ")}).`
    );
  }

  const evidence = Object.fromEntries(
    CATEGORY_ORDER.map((k) => [
      k,
      { technical: techEvidence, experience: expEvidence, teaching: teachEvidence, culture: cultureEvidence }[k],
    ])
  );

  return {
    id: input.id,
    name: extractName(text, fileName),
    targetRole: jobTitle.split(/\s[-—–|]\s/)[0].trim() || "Candidate",
    score,
    ...cls,
    strengths: strengths.slice(0, 12),
    gaps: gaps.slice(0, 8),
    metrics,
    evaluation: sentences.join(" "),
    method: "rule-based",
    fileName,
    yearsExperience: exp.relevantYears,
    evidence,
    claimedSkills: detectClaimedSkills(text),
    categoryLabels: { ...CATEGORY_LABELS, teaching: req.thirdCategoryLabel },
    screeningProfile: `${req.domainLabel} · ${req.seniority === "Not specified" ? `${req.requiredYears}+ yrs` : req.seniority}`,
  };
}
