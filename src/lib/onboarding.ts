/**
 * Onboarding questions and the plan we build from the answers.
 * Shared by the client flow and the server action, so keep it free of browser or server APIs.
 */

export type Option = { value: string; label: string };

const opts = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

export const GOALS = opts([
  ["first_job", "Land my first job"],
  ["better_company", "Switch to a better company"],
  ["level_up", "Level up to senior or staff"],
  ["big_tech", "Break into big tech"],
  ["exploring", "Just exploring for now"],
]);

export const SITUATIONS = opts([
  ["employed_active", "Employed, actively interviewing"],
  ["employed_casual", "Employed, casually looking"],
  ["searching", "Searching full-time"],
  ["student", "Student or new grad"],
  ["self_taught", "Bootcamp or self-taught"],
  ["switching", "Switching into tech"],
]);

export const EXPERIENCE = opts([
  ["intern", "Intern"],
  ["new_grad", "New grad"],
  ["1_2", "1 to 2 yrs"],
  ["3_5", "3 to 5 yrs"],
  ["6_9", "6 to 9 yrs"],
  ["10_plus", "10+ yrs"],
]);

export const ROLES = opts([
  ["frontend", "Frontend"],
  ["backend", "Backend"],
  ["fullstack", "Full-stack"],
  ["mobile", "Mobile"],
  ["ml", "ML / AI"],
  ["data", "Data"],
  ["devops", "DevOps / Platform"],
  ["security", "Security"],
  ["embedded", "Embedded"],
  ["qa", "QA / SDET"],
  ["em", "Engineering manager"],
]);

export const STACK = [
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "Swift",
  "Kotlin", "SQL", "React", "Node.js", "Next.js", "Vue", "Django", "Spring", "Docker",
  "Kubernetes", "AWS", "PostgreSQL", "GraphQL",
];

export const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Nvidia", "OpenAI", "Stripe",
  "Airbnb", "Databricks", "Anthropic",
];

export const WORK_MODES = opts([
  ["remote", "Remote"],
  ["hybrid", "Hybrid"],
  ["onsite", "Onsite"],
]);

export const VISA = opts([
  ["no", "No, citizen or permanent resident"],
  ["now", "Yes, I need sponsorship now"],
  ["later", "I will need it later"],
]);

export const STAGES = opts([
  ["not_started", "Not started applying yet"],
  ["no_replies", "Applying, not hearing back"],
  ["interviewing", "Interviewing, no offers yet"],
  ["offer", "I have an offer"],
]);

export const BLOCKERS = opts([
  ["resume", "My resume is not getting responses"],
  ["roles", "I cannot find good roles"],
  ["interviews", "I freeze or underperform in interviews"],
  ["underqualified", "I feel underqualified"],
  ["time", "I do not have time to apply"],
]);

export const TIME = opts([
  ["few", "A few hours"],
  ["mid", "5 to 15 hours"],
  ["lots", "15+ hours"],
]);

export const COMP_MAX = 400_000;
export const COMP_STEP = 10_000;

export type Answers = {
  firstName: string;
  goal: string;
  situation: string;
  experience: string;
  role: string;
  stack: string[];
  companies: string[];
  workModes: string[];
  basedIn: string;
  relocate: boolean;
  visa: string;
  compMin: number | null;
  stage: string;
  blocker: string;
  time: string;
  github: string;
  resumeText: string;
  resumeFilename: string;
  resumeScore: number | null;
};

export const EMPTY_ANSWERS: Answers = {
  firstName: "",
  goal: "",
  situation: "",
  experience: "",
  role: "",
  stack: [],
  companies: [],
  workModes: [],
  basedIn: "",
  relocate: false,
  visa: "",
  compMin: null,
  stage: "",
  blocker: "",
  time: "",
  github: "",
  resumeText: "",
  resumeFilename: "",
  resumeScore: null,
};

export const labelOf = (list: Option[], value: string) => list.find((o) => o.value === value)?.label ?? "";

const ROLE_TITLE: Record<string, string> = {
  frontend: "Frontend Engineer",
  backend: "Backend Engineer",
  fullstack: "Full-stack Engineer",
  mobile: "Mobile Engineer",
  ml: "ML Engineer",
  data: "Data Engineer",
  devops: "Platform Engineer",
  security: "Security Engineer",
  embedded: "Embedded Engineer",
  qa: "SDET",
  em: "Engineering Manager",
};

const LEVEL: Record<string, string> = {
  intern: "Intern",
  new_grad: "New-grad",
  "1_2": "Junior",
  "3_5": "Mid-level",
  "6_9": "Senior",
  "10_plus": "Staff",
};

const BIG_TECH = new Set(["Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Nvidia"]);

// Rough months to an offer by experience: [low, high].
const BASE_MONTHS: Record<string, [number, number]> = {
  intern: [5, 9],
  new_grad: [5, 9],
  "1_2": [4, 7],
  "3_5": [3, 6],
  "6_9": [3, 5],
  "10_plus": [3, 6],
};

export type PlanStep = { title: string; body: string };

export type Plan = {
  track: string;
  months: [number, number] | null; // null when they already have an offer
  interviewingBy: string | null; // e.g. "April"
  summary: string;
  steps: PlanStep[];
};

export function buildPlan(a: Answers, now = new Date()): Plan {
  const level = LEVEL[a.experience] ?? "";
  const role = ROLE_TITLE[a.role] ?? "Software Engineer";
  const bigTech = a.goal === "big_tech" || a.companies.some((c) => BIG_TECH.has(c));
  const trackName =
    a.goal === "level_up" ? "promotion track" : bigTech ? "big tech track" : "startup track";
  const track = [level, role].filter(Boolean).join(" ") + ", " + trackName;
  const name = a.firstName.trim() || "You";
  const first = a.companies[0];

  let months: [number, number] | null = null;
  let interviewingBy: string | null = null;
  let summary: string;

  if (a.stage === "offer") {
    summary = `${name}, you already have an offer. Let's make sure it's the right one, and see what else is out there before you sign.`;
  } else {
    let [lo, hi] = BASE_MONTHS[a.experience] ?? [4, 7];
    if (a.time === "few") [lo, hi] = [lo + 1, hi + 2];
    if (a.time === "lots") [lo, hi] = [Math.max(2, lo - 1), Math.max(3, hi - 2)];
    if (a.stage === "interviewing") [lo, hi] = [Math.max(1, lo - 2), Math.max(2, hi - 2)];
    if (bigTech) hi += 1;
    months = [lo, hi];
    const by = new Date(now.getFullYear(), now.getMonth() + Math.ceil(lo / 2), 1);
    interviewingBy = by.toLocaleString("en-US", { month: "long" });
    const pace = a.time === "few" ? "a steady search, even a few hours a week," : "a steady, focused search";
    const who = level ? `${level.toLowerCase()} ${role.toLowerCase()}s` : "engineers like you";
    summary = `${name}, ${who} who keep ${pace} typically land a role in about ${lo} to ${hi} months.`;
  }

  const resumeStep: PlanStep = a.resumeText
    ? {
        title: "Fix your resume",
        body:
          a.resumeScore !== null
            ? `Your resume scores ${a.resumeScore}/100 today. We fix the lines that are holding it back first.`
            : "We fix the lines that are holding it back first.",
      }
    : {
        title: "Build your resume",
        body: a.github
          ? `We turn your projects on github.com/${a.github} into a resume worth reading.`
          : "We turn your projects and experience into a resume worth reading.",
      };

  const tailorStep: PlanStep = {
    title: "Tailor it to every job",
    body: `One version per job post, matched to its words and your ${a.stack.slice(0, 2).join(" and ") || "skills"}. That's what gets replies.`,
  };

  const lastStep: PlanStep =
    a.stage === "offer"
      ? { title: "Weigh your offer", body: "Compare it with the roles you'd still get, and know your number." }
      : a.blocker === "interviews" || a.stage === "interviewing"
        ? {
            title: first ? `Prep for ${first} interviews` : "Prep for your interviews",
            body: "Practice the questions you'll actually get, built around your resume.",
          }
        : {
            title: "Apply where you fit",
            body: first
              ? `Roles at ${first} and companies like it, picked for your profile.`
              : "Roles picked for your profile, so you spend time on the ones worth it.",
          };

  return { track, months, interviewingBy, summary, steps: [resumeStep, tailorStep, lastStep] };
}
