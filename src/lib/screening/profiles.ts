/**
 * Role profiles: turn a job title + description into a screening profile
 * (domain, seniority, required years, core skills, third scoring category).
 *
 * Add a new domain by adding its skills to SKILLS and an entry to DOMAINS.
 */
import { DEFAULT_REQUIRED_YEARS } from "@/config/screening";

/* ------------------------------------------------------------------ */
/* Skill dictionary (shared by all domains). Patterns: global + case-insensitive. */
/* ------------------------------------------------------------------ */

export const SKILLS: Record<string, RegExp> = {
  // Software development — `(?<![.\w])js` avoids matching "Node.js"
  JavaScript: /\bjavascript\b|(?<![.\w])js\b|\bes6\b|\becmascript\b/gi,
  React: /\breact(?:\.js|js)?\b/gi,
  "Node.js": /\bnode(?:\.js|js)?\b|\bexpress(?:\.js|js)?\b|\bnest\.?js\b/gi,
  TypeScript: /\btypescript\b/gi,
  HTML: /\bhtml5?\b/gi,
  CSS: /\bcss3?\b|\btailwind(?:css)?\b|\bs[ac]ss\b/gi,
  "Next.js": /\bnext\.?js\b/gi,
  Vue: /\bvue(?:\.js|js)?\b/gi,
  Angular: /\bangular\b/gi,
  Python: /\bpython\b/gi,
  Java: /\bjava\b/gi,
  "C#/.NET": /c#|\.net\b/gi,
  SQL: /\bsql\b|\bpostgres(?:ql)?\b|\bmysql\b/gi,
  MongoDB: /\bmongo(?:db)?\b/gi,
  Git: /\bgit\b|\bgithub\b|\bgitlab\b/gi,
  "REST APIs": /\brest(?:ful)?\b(?:\s+apis?)?|\bgraphql\b/gi,
  Testing: /\bjest\b|\bunit test(?:s|ing)?\b|\bcypress\b|\bplaywright\b|\bvitest\b/gi,
  Docker: /\bdocker\b|\bdocker[- ]compose\b/gi,
  Cloud: /\baws\b|\bazure\b|\bgcp\b|\bgoogle cloud\b|\bvercel\b|\bheroku\b/gi,

  // Cybersecurity
  "Network Security":
    /\bnetwork security\b|\bfirewalls?\b|\bids\/ips\b|\bintrusion (?:detection|prevention)\b|\bvpns?\b|\btcp\/ip\b|\bvlans?\b|\bnetwork (?:hardening|monitoring|segmentation)\b/gi,
  Linux: /\blinux\b|\bubuntu\b|\bdebian\b|\bcentos\b|\bred hat\b|\brhel\b|\bkali\b/gi,
  "Windows / Active Directory": /\bactive directory\b|\bwindows server\b|\bgroup policy\b|\bwindows security\b/gi,
  SIEM: /\bsiem\b|\bsplunk\b|\bqradar\b|\bmicrosoft sentinel\b|\bazure sentinel\b|\belk stack\b|\bwazuh\b|\barcsight\b/gi,
  "Incident Response":
    /\bincident (?:response|handling)\b|\bthreat hunting\b|\bsoc\b|\bdfir\b|\bdigital forensics\b|\bsecurity (?:alerts?|monitoring|operations)\b|\balert triage\b/gi,
  "Penetration Testing":
    /\bpenetration test(?:ing|er|s)?\b|\bpen ?test(?:ing|er|s)?\b|\bethical hack(?:ing|er)\b|\bburp suite\b|\bmetasploit\b|\bnmap\b|\bred team(?:ing)?\b|\bowasp\b/gi,
  "Vulnerability Management":
    /\bvulnerabilit(?:y|ies) (?:assessments?|management|scanning|scans?)\b|\bnessus\b|\bopenvas\b|\bqualys\b|\bcves?\b|\bpatch management\b/gi,
  "Packet Analysis": /\bwireshark\b|\btcpdump\b|\bpacket (?:analysis|capture)\b/gi,
  Cryptography: /\bcryptograph(?:y|ic)\b|\bencryption\b|\bpki\b|\btls\b/gi,
  Scripting: /\bbash\b|\bpowershell\b|\bshell scripting\b/gi,
  "Security Frameworks": /\biso ?27001\b|\bnist\b|\bmitre att&?ck\b|\bcis controls?\b|\bgdpr\b|\bpci[- ]dss\b/gi,
  "Cloud Security": /\bcloud security\b|\biam\b|\bzero trust\b/gi,

  // Data & AI
  Excel: /\bexcel\b|\bvlookup\b|\bpivot tables?\b/gi,
  "Power BI / Tableau": /\bpower ?bi\b|\btableau\b|\blooker\b/gi,
  Statistics: /\bstatistic(?:s|al)\b|\bregression\b|\bhypothesis testing\b|\ba\/b test(?:s|ing)?\b|\bprobability\b/gi,
  "Machine Learning":
    /\bmachine learning\b|\bdeep learning\b|\bscikit-learn\b|\bsklearn\b|\btensorflow\b|\bpytorch\b|\bkeras\b|\bnlp\b/gi,
  "Pandas / NumPy": /\bpandas\b|\bnumpy\b|\bjupyter\b/gi,
  "Data Visualization": /\bdata visuali[sz]ation\b|\bmatplotlib\b|\bseaborn\b|\bplotly\b/gi,
  "Big Data": /\bspark\b|\bpyspark\b|\bhadoop\b|\bdatabricks\b|\bbigquery\b|\bsnowflake\b/gi,

  // DevOps & cloud
  Kubernetes: /\bkubernetes\b|\bk8s\b|\bhelm\b/gi,
  "CI/CD": /\bci\/cd\b|\bjenkins\b|\bgithub actions\b|\bgitlab ci\b|\bcontinuous (?:integration|delivery|deployment)\b/gi,
  "Infrastructure as Code": /\bterraform\b|\bansible\b|\bcloudformation\b|\bpulumi\b|\binfrastructure as code\b/gi,
  Monitoring: /\bprometheus\b|\bgrafana\b|\bdatadog\b|\bnagios\b|\bzabbix\b|\bobservability\b/gi,
  Networking: /\bnetworking\b|\bdns\b|\bload balanc(?:er|ers|ing)\b/gi,

  // UI/UX design
  Figma: /\bfigma\b/gi,
  "Adobe Creative Suite": /\bphotoshop\b|\billustrator\b|\badobe xd\b|\bindesign\b|\bafter effects\b/gi,
  "User Research": /\buser research\b|\buser interviews?\b|\bpersonas?\b|\bjourney maps?\b|\bjourney mapping\b/gi,
  "Wireframing & Prototyping": /\bwirefram(?:e|es|ing)\b|\bprototyp(?:e|es|ing)\b/gi,
  "Usability Testing": /\busability test(?:s|ing)?\b|\buser testing\b/gi,
  "Design Systems": /\bdesign systems?\b|\bstyle guides?\b|\bcomponent librar(?:y|ies)\b/gi,
  "UI Design": /\bui design\b|\binterface design\b|\bvisual design\b|\btypography\b/gi,

  // Marketing
  SEO: /\bseo\b|\bsearch engine optimi[sz]ation\b/gi,
  "Paid Ads": /\bgoogle ads\b|\bmeta ads\b|\bfacebook ads\b|\bppc\b|\bpaid (?:social|search|media)\b/gi,
  "Social Media Marketing": /\bsocial media\b|\bsmm\b|\binstagram\b|\btiktok\b/gi,
  "Content Marketing": /\bcontent (?:marketing|strategy|creation|calendars?)\b|\bcopywriting\b/gi,
  "Marketing Analytics": /\bgoogle analytics\b|\bga4\b|\bmarketing analytics\b|\bconversion rates?\b/gi,
  "Email Marketing": /\bemail marketing\b|\bnewsletters?\b|\bmailchimp\b|\bhubspot\b/gi,
};

export const ALL_SKILL_NAMES = Object.keys(SKILLS);

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export type DomainId = "software" | "cybersecurity" | "data" | "devops" | "design" | "marketing" | "general";

export interface Domain {
  id: DomainId;
  label: string;
  /** Matches job titles in this domain. */
  title: RegExp;
  /** Skills that belong to this domain (core skills are picked from these). */
  skills: string[];
  /** Used when the job description names fewer than 2 domain skills. */
  defaultCore: string[];
  /** Relevant job titles in a CV's work history. */
  roles: RegExp;
  /** Words that make a teaching/intern role relevant to this domain. */
  context: RegExp;
  /** Industry certifications (global regex). */
  certs: RegExp;
  /** Continuous-learning signals (global regex). */
  learning: RegExp;
}

// Learning the candidate did (not courses they taught).
const COMMON_LEARNING = String.raw`\bcoursera\b|\budemy\b|\bedx\b|\bonline courses?\b|\bcompleted (?:an? |the )?(?:[\w-]+ ){0,3}(?:course|bootcamp|program(?:me)?|specialization)\b|\b(?:bootcamp|course) graduate\b|\bhackathons?\b|\bworkshops? attended\b|\bcertificate of completion\b`;

export const DOMAINS: Record<Exclude<DomainId, "general">, Domain> = {
  software: {
    id: "software",
    label: "Software Development",
    title:
      /\b(software|developer|programmer|front[- ]?end|back[- ]?end|full[- ]?stack|web dev\w*|mobile dev\w*|javascript|react|node(?:\.js)?|coding|programming)\b/i,
    skills: ["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS", "Next.js", "Vue", "Angular", "Python", "Java", "C#/.NET", "SQL", "MongoDB", "Git", "REST APIs", "Testing", "Docker", "Cloud"],
    defaultCore: ["JavaScript", "React", "Node.js"],
    roles: /\b(developer|programmer|software engineer|software|full[- ]?stack|front[- ]?end|back[- ]?end|web dev(?:elopment)?|mobile dev\w*)\b/i,
    context: /\b(software|programming|coding|code|web|javascript|react|node|developer|computer science|frontend|front-end|backend|back-end|full[- ]?stack|bootcamp)\b/i,
    certs: /\baws certified developer\b|\boracle certified\b|\bmeta front-end developer\b|\bazure developer\b|\bjs certification\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\bopen[- ]source\\b|\\bleetcode\\b`, "gi"),
  },
  cybersecurity: {
    id: "cybersecurity",
    label: "Cybersecurity",
    title:
      /\b(cyber\w*|security|soc|infosec|pen ?test\w*|penetration|red team|blue team|threat|forensics?|incident respon\w*)\b/i,
    skills: ["Network Security", "Linux", "Windows / Active Directory", "SIEM", "Incident Response", "Penetration Testing", "Vulnerability Management", "Packet Analysis", "Cryptography", "Scripting", "Python", "Security Frameworks", "Cloud Security", "Cloud", "Networking"],
    defaultCore: ["Network Security", "Linux", "SIEM", "Incident Response", "Vulnerability Management"],
    roles:
      /\b(security (?:analyst|engineer|specialist|consultant|administrator|intern|officer)|soc (?:analyst|engineer|intern)|cyber ?security|penetration tester|pen ?tester|incident responder|threat (?:intelligence|hunter)|network (?:engineer|administrator)|system administrator|sysadmin|it security|information security)\b/i,
    context: /\b(security|cyber|soc|network|firewall|siem|vulnerab\w*|incident|linux|threat|it support)\b/i,
    certs:
      /\bsecurity\+|\bcomptia (?:security|network|cysa|pentest)\+?|\bnetwork\+|\bcysa\+|\bpentest\+|\bceh\b|\boscp\b|\bcissp\b|\bcism\b|\bccna\b|\bejpt\b|\bgsec\b|\bgcih\b|\bisc2 cc\b|\bcertified in cybersecurity\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\btryhackme\\b|\\bhack ?the ?box\\b|\\bctfs?\\b|\\bcapture the flag\\b|\\bhome ?lab\\b|\\bcybrary\\b|\\bpicoctf\\b`, "gi"),
  },
  data: {
    id: "data",
    label: "Data & AI",
    title:
      /\b(data|analytics|machine learning|ml engineer|ai engineer|artificial intelligence|business intelligence|bi analyst|bi developer|statistician)\b/i,
    skills: ["Python", "SQL", "Excel", "Power BI / Tableau", "Statistics", "Machine Learning", "Pandas / NumPy", "Data Visualization", "Big Data", "Git", "Cloud"],
    defaultCore: ["Python", "SQL", "Excel", "Statistics", "Power BI / Tableau"],
    roles:
      /\b(data (?:analyst|scientist|engineer)|bi (?:analyst|developer)|business intelligence|machine learning engineer|ml engineer|research analyst|analytics (?:specialist|engineer))\b/i,
    context: /\b(data|analytics|sql|python|statistic\w*|machine learning|dashboard|excel|power bi|tableau)\b/i,
    certs:
      /\bgoogle data analytics\b|\bpl-300\b|\bdp-\d{3}\b|\btensorflow developer\b|\baws certified (?:machine learning|data)\b|\bibm data science\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\bkaggle\\b|\\bdatacamp\\b`, "gi"),
  },
  devops: {
    id: "devops",
    label: "DevOps & Cloud",
    title: /\b(devops|sre|site reliability|cloud|platform engineer|infrastructure|system administrator|sysadmin)\b/i,
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Cloud", "Infrastructure as Code", "Monitoring", "Scripting", "Python", "Networking", "Git"],
    defaultCore: ["Linux", "Docker", "Kubernetes", "CI/CD", "Cloud"],
    roles:
      /\b(devops|site reliability|sre|cloud engineer|platform engineer|infrastructure engineer|system administrator|sysadmin|systems engineer)\b/i,
    context: /\b(cloud|linux|docker|kubernetes|ci\/cd|infrastructure|terraform|aws|azure|deployment)\b/i,
    certs:
      /\baws certified\b|\bcka\b|\bckad\b|\baz-\d{3}\b|\bterraform associate\b|\brhcsa\b|\brhce\b|\bgoogle cloud certified\b|\blfcs\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\bhome ?lab\\b|\\bkodekloud\\b`, "gi"),
  },
  design: {
    id: "design",
    label: "UI/UX Design",
    title: /\b(design\w*|ux|ui|ui\/ux|product designer)\b/i,
    skills: ["Figma", "Adobe Creative Suite", "User Research", "Wireframing & Prototyping", "Usability Testing", "Design Systems", "UI Design", "HTML", "CSS"],
    defaultCore: ["Figma", "User Research", "Wireframing & Prototyping", "Usability Testing", "UI Design"],
    roles: /\b((?:ui|ux|ui\/ux|product|graphic|visual|web|interaction) designer|ux researcher|designer)\b/i,
    context: /\b(design|ux|ui|figma|prototype|user research)\b/i,
    certs: /\bgoogle ux\b|\bnn\/g\b|\bux certification\b|\badobe certified\b|\binteraction design foundation\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\bbehance\\b|\\bdribbble\\b`, "gi"),
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    title: /\b(marketing|marketer|smm|seo|content|brand|social media|growth)\b/i,
    skills: ["SEO", "Paid Ads", "Social Media Marketing", "Content Marketing", "Marketing Analytics", "Email Marketing"],
    defaultCore: ["SEO", "Paid Ads", "Social Media Marketing", "Content Marketing", "Marketing Analytics"],
    roles:
      /\b(marketing (?:specialist|manager|assistant|coordinator|executive|intern)|digital marketer|marketer|smm (?:specialist|manager)|social media (?:manager|specialist)|seo specialist|content (?:manager|writer|strategist)|brand manager|growth (?:manager|marketer))\b/i,
    context: /\b(marketing|campaign|seo|social media|brand|content|ads)\b/i,
    certs:
      /\bgoogle ads certif\w*|\bgoogle analytics certif\w*|\bhubspot (?:academy|certif\w*)|\bmeta (?:certified|blueprint)\b/gi,
    learning: new RegExp(`${COMMON_LEARNING}|\\bgoogle digital garage\\b`, "gi"),
  },
};

const DOMAIN_LIST = Object.values(DOMAINS);

const GENERAL: Domain = {
  id: "general",
  label: "General",
  title: /$^/,
  skills: ALL_SKILL_NAMES,
  defaultCore: [],
  roles: new RegExp(DOMAIN_LIST.map((d) => d.roles.source).join("|"), "i"),
  context: /\b(professional|work|project)\b/i,
  certs: new RegExp(DOMAIN_LIST.map((d) => d.certs.source).join("|"), "gi"),
  learning: new RegExp(COMMON_LEARNING, "gi"),
};

export function getDomain(id: DomainId): Domain {
  return id === "general" ? GENERAL : DOMAINS[id];
}

/* ------------------------------------------------------------------ */
/* Job profile                                                         */
/* ------------------------------------------------------------------ */

export type Seniority = "Intern" | "Junior" | "Mid-level" | "Senior" | "Not specified";

const LANGUAGE_NAMES: [string, RegExp][] = [
  ["Azerbaijani", /\bazerbaijani\b|\bazeri\b|\bazərbaycan(?:\s+dili)?\b/i],
  ["English", /\benglish\b/i],
  ["Russian", /\brussian\b/i],
  ["Turkish", /\bturkish\b/i],
];

const TEACHING_JOB = /\b(teach\w*|instructor|lecturer|trainer|tutor|educator|professor|mentor(?:ing)? students)\b/i;

export interface JobProfile {
  domain: DomainId;
  domainLabel: string;
  seniority: Seniority;
  requiredYears: number;
  /** true when years came from an explicit number in the job description. */
  yearsStated: boolean;
  coreSkills: string[];
  /** true when core skills were taken from the description (not domain defaults). */
  coreFromDescription: boolean;
  languages: string[];
  /** Teaching roles score "Teaching & Mentorship"; others score "Certifications & Learning". */
  teachingRole: boolean;
  thirdCategoryLabel: string;
  /** Domain implied by the title alone / description alone (for mismatch warnings). */
  titleDomain: DomainId | null;
  descriptionDomain: DomainId | null;
  mismatch: boolean;
}

function skillHits(text: string, names: string[]) {
  return names.filter((n) => {
    const re = SKILLS[n];
    re.lastIndex = 0;
    return re.test(text);
  });
}

function bestTitleDomain(title: string): DomainId | null {
  let best: DomainId | null = null;
  let bestScore = 0;
  for (const d of DOMAIN_LIST) {
    const m = title.match(new RegExp(d.title.source, "gi"));
    const score = m ? m.length : 0;
    if (score > bestScore) {
      best = d.id;
      bestScore = score;
    }
  }
  return best;
}

/** Domain implied by which domain's skills the description mentions most (≥2 needed). */
function bestDescriptionDomain(description: string): { id: DomainId | null; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const d of DOMAIN_LIST) {
    // Count only skills that are specific to this domain to avoid ties on shared skills (Python, Git…).
    const specific = d.skills.filter((s) => DOMAIN_LIST.filter((o) => o.skills.includes(s)).length === 1);
    scores[d.id] = skillHits(description, specific).length + (d.roles.test(description) ? 1 : 0);
  }
  const [id, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { id: score >= 2 ? (id as DomainId) : null, scores };
}

function detectSeniority(text: string): { seniority: Seniority; years: number } {
  if (/\b(intern|internship|trainee)\b/i.test(text)) return { seniority: "Intern", years: 0 };
  if (/\b(junior|jr\.?|entry[- ]level|graduate|associate)\b/i.test(text)) return { seniority: "Junior", years: 1 };
  if (/\b(senior|sr\.?|lead|principal|staff|head of)\b/i.test(text)) return { seniority: "Senior", years: 5 };
  if (/\bmid(?:dle)?[- ]?level\b|\bmid\b/i.test(text)) return { seniority: "Mid-level", years: 3 };
  return { seniority: "Not specified", years: DEFAULT_REQUIRED_YEARS };
}

export function parseJobProfile(title: string, description: string): JobProfile {
  const titleDomain = bestTitleDomain(title);
  const { id: descriptionDomain, scores } = bestDescriptionDomain(description);
  const domainId: DomainId = titleDomain ?? descriptionDomain ?? "general";
  const domain = getDomain(domainId);

  const mismatch =
    titleDomain !== null &&
    descriptionDomain !== null &&
    titleDomain !== descriptionDomain &&
    (scores[titleDomain] ?? 0) < 2;

  // Core skills: domain skills named in the description; fall back to domain defaults.
  // If the description belongs to another domain (mismatch), don't borrow its skills.
  const named = mismatch ? [] : skillHits(description + " " + title, domain.skills);
  let coreSkills: string[];
  let coreFromDescription = true;
  if (named.length >= 2) coreSkills = named.slice(0, 8);
  else {
    coreFromDescription = false;
    coreSkills = [...new Set([...named, ...domain.defaultCore])].slice(0, 6);
  }

  const { seniority, years: seniorityYears } = detectSeniority(title + " " + description);
  // A mismatched (stale) description shouldn't set years or turn on teaching scoring.
  const yearsMatch = mismatch ? null : description.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i);
  const requiredYears = yearsMatch ? Math.max(0, parseInt(yearsMatch[1], 10)) : seniorityYears;

  const teachingRole = TEACHING_JOB.test(mismatch ? title : title + " " + description);

  return {
    domain: domainId,
    domainLabel: domain.label,
    seniority,
    requiredYears,
    yearsStated: Boolean(yearsMatch),
    coreSkills,
    coreFromDescription,
    languages: LANGUAGE_NAMES.filter(([, re]) => re.test(description)).map(([n]) => n),
    teachingRole,
    thirdCategoryLabel: teachingRole ? "Teaching & Mentorship" : "Certifications & Learning",
    titleDomain,
    descriptionDomain,
    mismatch,
  };
}

/* ------------------------------------------------------------------ */
/* Job description templates (used when title and description disagree) */
/* ------------------------------------------------------------------ */

const TEMPLATE_BODY: Record<Exclude<DomainId, "general">, string[]> = {
  software: [
    "Build and maintain web applications with JavaScript, React and Node.js.",
    "Write clean, tested code and use Git for version control.",
    "Work with REST APIs and SQL databases.",
  ],
  cybersecurity: [
    "Monitor security alerts with SIEM tools (e.g. Splunk, Wazuh) and support incident response.",
    "Run vulnerability scanning and help remediate findings.",
    "Harden Linux and Windows systems; manage firewalls and network security controls.",
    "Automate security tasks with Python or Bash scripting.",
    "Security+ or a similar certification is a plus.",
  ],
  data: [
    "Clean, analyze and visualize data using Python, SQL and Excel.",
    "Build dashboards in Power BI or Tableau.",
    "Apply statistics to answer business questions.",
  ],
  devops: [
    "Operate Linux servers and containerized workloads with Docker and Kubernetes.",
    "Build CI/CD pipelines and manage cloud infrastructure (AWS or Azure).",
    "Use Terraform for infrastructure as code and set up monitoring.",
  ],
  design: [
    "Design user interfaces in Figma, from wireframes to high-fidelity prototypes.",
    "Run user research and usability testing.",
    "Maintain a consistent design system.",
  ],
  marketing: [
    "Plan and run social media and paid ads campaigns (Google Ads, Meta Ads).",
    "Improve SEO and create content for the website and channels.",
    "Report results using Google Analytics.",
  ],
};

export function jobTemplate(domain: DomainId, seniority: Seniority, title: string): string | null {
  if (domain === "general") return null;
  const years = detectSeniority(seniority).years;
  const yearsLine =
    seniority === "Intern"
      ? "- Students or recent graduates welcome; internships or personal projects count."
      : `- Minimum ${years} year${years === 1 ? "" : "s"} of relevant experience${seniority === "Junior" ? " (internships and projects count)" : ""}.`;
  return [
    title.trim() || DOMAINS[domain].label,
    "",
    "Responsibilities and requirements:",
    ...TEMPLATE_BODY[domain].map((l) => `- ${l}`),
    yearsLine,
    "- Good communication and teamwork skills.",
    "- Fluency in Azerbaijani and English.",
  ].join("\n");
}
