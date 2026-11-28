/**
 * Rule-based resume checker for junior software engineers.
 * Runs entirely in the browser: the resume text never leaves the page.
 */

export type Check = {
  id: string;
  label: string; // what we checked, shown to everyone
  pass: boolean;
  detail: string; // what we found, shown to everyone
  fix: string; // how to fix it, unlocked with email
  examples?: string[]; // offending lines from their resume, unlocked with email
  weight: number;
};

export type ResumeReport = {
  score: number; // 0..100
  words: number;
  checks: Check[];
};

const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "assisted with",
  "involved in",
  "participated in",
  "various",
  "hard-working",
  "hardworking",
  "team player",
  "detail-oriented",
  "detail oriented",
  "passionate about",
  "go-getter",
  "self-starter",
];

const STRONG_VERBS = [
  "built", "shipped", "designed", "created", "developed", "implemented", "launched",
  "led", "reduced", "cut", "improved", "increased", "optimized", "automated", "migrated",
  "refactored", "wrote", "deployed", "scaled", "architected", "integrated", "added",
  "replaced", "rewrote", "fixed", "debugged", "profiled", "tested", "owned", "mentored",
  "contributed", "published", "maintained", "engineered", "prototyped", "delivered",
];

const TECH = [
  "javascript", "typescript", "python", "java", "c++", "c#", "golang", "rust", "kotlin",
  "swift", "ruby", "php", "sql", "react", "next.js", "nextjs", "vue", "angular", "svelte",
  "node", "node.js", "express.js", "django", "flask", "fastapi", "spring", "rails", "graphql",
  "grpc", "postgres", "postgresql", "mysql", "mongodb", "redis", "sqlite", "docker",
  "kubernetes", "aws", "gcp", "azure", "terraform", "linux", "git", "ci/cd", "github actions",
  "tailwind", "html", "css", "pytorch", "tensorflow", "pandas", "numpy", "kafka", "firebase",
  "supabase", "vercel", "jest", "pytest", "llvm", "webassembly", "android", "ios",
];

const PRONOUNS = /\b(i|me|my|mine|myself)\b/i;

/** Lines that look like resume bullets or sentences worth judging. */
function contentLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•●▪◦\-*–·]+/, "").trim())
    .filter((l) => l.split(/\s+/).length >= 5);
}

function clip(line: string, max = 110) {
  return line.length > max ? line.slice(0, max - 1).trimEnd() + "…" : line;
}

export function checkResume(raw: string): ResumeReport {
  const text = raw.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const words = (text.match(/\S+/g) ?? []).length;
  const lines = contentLines(text);
  const checks: Check[] = [];

  // 1. Numbers that show impact
  const withNumbers = lines.filter((l) => /\d/.test(l) && !/^\s*(19|20)\d{2}\b/.test(l));
  const noNumbers = lines.filter((l) => !/\d/.test(l));
  checks.push({
    id: "numbers",
    label: "Shows results with numbers",
    pass: withNumbers.length >= 3,
    detail: `${withNumbers.length} line${withNumbers.length === 1 ? "" : "s"} with a number in it`,
    fix: "Add a number to your best bullets: users, stars, speed-up, test coverage, PRs merged, or time saved. \"Cut page load from 3s to 0.8s\" beats \"Made the site faster\".",
    examples: noNumbers.slice(0, 3).map(clip),
    weight: 20,
  });

  // 2. Weak phrases
  const weakLines = lines.filter((l) => WEAK_PHRASES.some((p) => l.toLowerCase().includes(p)));
  checks.push({
    id: "weak",
    label: "Avoids weak, vague phrases",
    pass: weakLines.length === 0,
    detail:
      weakLines.length === 0
        ? "No filler phrases found"
        : `${weakLines.length} line${weakLines.length === 1 ? "" : "s"} with filler like "responsible for" or "worked on"`,
    fix: "Replace \"responsible for\", \"worked on\" and \"helped with\" with what you actually did. Start with a verb like Built, Shipped or Cut.",
    examples: weakLines.slice(0, 3).map(clip),
    weight: 15,
  });

  // 3. Bullets start with strong verbs
  const startsStrong = lines.filter((l) =>
    STRONG_VERBS.includes(l.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "")),
  );
  const ratio = lines.length ? startsStrong.length / lines.length : 0;
  checks.push({
    id: "verbs",
    label: "Bullets start with action verbs",
    pass: ratio >= 0.4,
    detail: `${Math.round(ratio * 100)}% of lines start with a strong verb`,
    fix: "Start each bullet with a past-tense action verb: Built, Designed, Shipped, Reduced, Automated. It makes you the person who did the work.",
    examples: lines
      .filter((l) => !startsStrong.includes(l))
      .slice(0, 3)
      .map(clip),
    weight: 15,
  });

  // 4. Projects section
  const hasProjects = /\bprojects?\b/i.test(text);
  checks.push({
    id: "projects",
    label: "Has a projects section",
    pass: hasProjects,
    detail: hasProjects ? "Projects section found" : "No projects section found",
    fix: "As a junior engineer, your projects are your proof. Add a Projects section near the top with 2 to 3 projects, each with what it does, the stack, and one result.",
    weight: 15,
  });

  // 5. GitHub / portfolio link
  const hasGithub = /github\.com\/[a-z0-9-]+/i.test(text);
  const hasLink = hasGithub || /https?:\/\/|\.(dev|io|app|me)\b/i.test(text);
  checks.push({
    id: "links",
    label: "Links to your code",
    pass: hasGithub,
    detail: hasGithub ? "GitHub link found" : hasLink ? "A link, but no GitHub" : "No GitHub or portfolio link",
    fix: "Put your GitHub link in the header, and link each project to its repo or live demo. Recruiters click.",
    weight: 10,
  });

  // 6. Tech stack
  const techFound = TECH.filter((t) =>
    new RegExp(`(^|[^a-z])${t.replace(/[.+#/]/g, "\\$&")}([^a-z]|$)`, "i").test(lower),
  );
  checks.push({
    id: "tech",
    label: "Names your tech stack",
    pass: techFound.length >= 5,
    detail: `${techFound.length} technologies mentioned`,
    fix: "Name the tools you used inside each project, not only in a skills list. Match the words in the job post (e.g. \"PostgreSQL\", not \"databases\").",
    weight: 10,
  });

  // 7. Length
  const goodLength = words >= 250 && words <= 750;
  checks.push({
    id: "length",
    label: "Fits on one page",
    pass: goodLength,
    detail: `${words} words`,
    fix:
      words < 250
        ? "It's short. Add 2 to 3 bullets per project with what you built and what happened because of it."
        : "It's long for a junior role. Keep one page: cut old or unrelated jobs and keep your best 2 to 3 projects.",
    weight: 10,
  });

  // 8. No first person
  const pronounLines = lines.filter((l) => PRONOUNS.test(l));
  checks.push({
    id: "pronouns",
    label: "No \"I\" or \"my\"",
    pass: pronounLines.length === 0,
    detail:
      pronounLines.length === 0
        ? "No first-person words"
        : `${pronounLines.length} line${pronounLines.length === 1 ? "" : "s"} use \"I\" or \"my\"`,
    fix: "Drop \"I\" and \"my\". \"I built a chat app\" becomes \"Built a chat app\".",
    examples: pronounLines.slice(0, 3).map(clip),
    weight: 5,
  });

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  return { score: Math.round((earned / total) * 100), words, checks };
}
