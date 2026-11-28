"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { checkResume } from "@/lib/resume-check";
import { readResumeFile } from "@/lib/read-resume-file";
import { createClient } from "@/lib/supabase/client";
import {
  BLOCKERS, COMPANIES, COMP_MAX, COMP_STEP, EMPTY_ANSWERS, EXPERIENCE, GOALS, ROLES, SITUATIONS,
  STACK, STAGES, TIME, VISA, WORK_MODES, buildPlan, type Answers, type Option,
} from "@/lib/onboarding";

const SCREENS = [
  "intro", "name", "goal", "situation", "experience", "role", "stack", "fact_seconds",
  "companies", "location", "visa", "comp", "fact_tailor", "stage", "blocker", "time", "resume",
  "github", "building", "plan", "save", "saved",
] as const;
type Screen = (typeof SCREENS)[number];

const QUESTIONS: Screen[] = [
  "name", "goal", "situation", "experience", "role", "stack", "companies", "location", "visa",
  "comp", "stage", "blocker", "time", "resume", "github",
];

const STORAGE_KEY = "wowresume:onboarding";
const ADVANCE_MS = 220; // pause on a picked option before moving on

type Stored = { answers: Answers; screen: Screen };

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!SCREENS.includes(s.screen)) return null;
    return { answers: { ...EMPTY_ANSWERS, ...s.answers }, screen: s.screen };
  } catch {
    return null;
  }
}

function store(s: Stored | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage full: the flow still works, it just won't resume.
  }
}

/** Rendered on the client only (see client.tsx), so it can read localStorage while initializing. */
export function Onboarding() {
  // Resume where they left off. Coming back from sign-in (?saved=1) lands on "save" and finishes below.
  // Answers and the resume only ever live in this browser's localStorage, never on our servers.
  const [init] = useState(() => {
    const saved = load();
    const returning = new URLSearchParams(window.location.search).get("saved") === "1";
    const screen: Screen = !saved
      ? "intro"
      : returning
        ? "save"
        : saved.screen === "building"
          ? "plan"
          : saved.screen;
    return { answers: saved?.answers ?? EMPTY_ANSWERS, screen, finishSave: returning && Boolean(saved) };
  });
  const [screen, setScreen] = useState<Screen>(init.screen);
  const [a, setA] = useState<Answers>(init.answers);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("saved")) {
      window.history.replaceState(null, "", "/welcome");
    }
    if (init.finishSave) void persist(init.answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (screen !== "intro") store({ answers: a, screen });
  }, [a, screen]);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v }));

  // Tracks the live screen so a double click (or a late timer) can't advance twice.
  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;

  const go = (to: Screen, from: Screen = screen) => {
    if (screenRef.current !== from) return;
    if (QUESTIONS.includes(from) || from === "intro") {
      posthog.capture(from === "intro" ? "onboarding_started" : "onboarding_step_completed", { step: from });
    }
    screenRef.current = to;
    setScreen(to);
    window.scrollTo({ top: 0 });
  };
  const next = () => go(SCREENS[SCREENS.indexOf(screen) + 1]);
  const back = () => {
    if (screen === "save") return setScreen("plan");
    const i = SCREENS.indexOf(screen);
    setScreen(SCREENS[Math.max(0, i - 1)] === "building" ? "github" : SCREENS[Math.max(0, i - 1)]);
  };

  /** Finishes onboarding once they're signed in. Nothing is uploaded: the plan stays in this browser. */
  async function persist(answers: Answers) {
    const { data } = await createClient().auth.getClaims();
    if (!data?.claims?.sub) {
      setScreen("save");
      return false;
    }
    posthog.capture("onboarding_saved", { has_resume: Boolean(answers.resumeText) });
    setScreen("saved");
    return true;
  }

  const qIndex = QUESTIONS.indexOf(screen);
  const showBack = !["intro", "building", "plan", "saved"].includes(screen);

  return (
    // ph-no-capture: PostHog autocapture and session replay skip this flow, so answers never reach analytics.
    <div className="ph-no-capture flex min-h-svh flex-col bg-[#0a0a0a] text-[#ededed]">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 bg-[#0a0a0a]/90 px-4 backdrop-blur sm:px-6">
        <div className="flex w-8 justify-start">
          {showBack && (
            <button
              type="button"
              onClick={back}
              aria-label="Go back"
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-[#8a8a8a] hover:bg-[#161616] hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
          )}
        </div>
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.04em]">
          wowresume<span className="text-[#4ade80]">.</span>
        </Link>
        <div className="flex flex-1 items-center gap-4">
          {qIndex >= 0 && (
            <>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#1c1c1c]">
                <div
                  className="h-full rounded-full bg-[#4ade80] transition-[width] duration-500 ease-out"
                  style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <span className="hidden font-mono text-[11px] tracking-[0.15em] text-[#666] sm:block">
                STEP {String(qIndex + 1).padStart(2, "0")} / {QUESTIONS.length}
              </span>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-16 sm:px-6">
        <div key={screen} className="animate-step-in my-auto w-full max-w-xl py-10">
          <Step screen={screen} a={a} set={set} next={next} go={go} persist={persist} />
        </div>
      </main>
    </div>
  );
}

type StepProps = {
  screen: Screen;
  a: Answers;
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  next: () => void;
  go: (s: Screen) => void;
  persist: (a: Answers) => Promise<boolean>;
};

function Step({ screen, a, set, next, go, persist }: StepProps) {
  const name = a.firstName.trim();
  const you = (s: string) => (name ? `${name}, ${s}` : s.charAt(0).toUpperCase() + s.slice(1));
  const choose = (k: "goal" | "situation" | "experience" | "role" | "visa" | "stage" | "blocker" | "time") =>
    (v: string) => {
      set(k, v);
      window.setTimeout(next, ADVANCE_MS);
    };

  switch (screen) {
    case "intro":
      return (
        <>
          <Eyebrow>Let&apos;s begin</Eyebrow>
          <Title>Build your path to hired.</Title>
          <Sub>
            A few quick questions, then you&apos;ll see the roles to target, what to fix first, and
            how long it should take. About 2 minutes, no account needed yet.
          </Sub>
          <div className="mt-8">
            <Primary onClick={next}>Start</Primary>
          </div>
        </>
      );

    case "name":
      return (
        <>
          <Eyebrow>Your name</Eyebrow>
          <Title>First, what should we call you?</Title>
          <Sub>Just your first name. This is your plan, not a form.</Sub>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name) next();
            }}
          >
            <TextInput
              autoFocus
              value={a.firstName}
              onChange={(v) => set("firstName", v)}
              placeholder="Your first name"
              autoComplete="given-name"
              maxLength={60}
            />
            <Actions>
              <Primary type="submit" disabled={!name}>Continue</Primary>
            </Actions>
          </form>
        </>
      );

    case "goal":
      return (
        <>
          <Eyebrow>Your goal</Eyebrow>
          <Title>{you("what are you here to do?")}</Title>
          <Choices options={GOALS} value={a.goal} onPick={choose("goal")} />
        </>
      );

    case "situation":
      return (
        <>
          <Eyebrow>Your situation</Eyebrow>
          <Title>Where are you right now{name ? `, ${name}` : ""}?</Title>
          <Choices options={SITUATIONS} value={a.situation} onPick={choose("situation")} />
        </>
      );

    case "experience":
      return (
        <>
          <Eyebrow>Experience</Eyebrow>
          <Title>How much experience do you have?</Title>
          <Choices options={EXPERIENCE} value={a.experience} onPick={choose("experience")} cols={3} />
        </>
      );

    case "role":
      return (
        <>
          <Eyebrow>Your craft</Eyebrow>
          <Title>What do you build?</Title>
          <Choices options={ROLES} value={a.role} onPick={choose("role")} cols={2} />
        </>
      );

    case "stack":
      return (
        <>
          <Eyebrow>Your stack</Eyebrow>
          <Title>Pick your main tools.</Title>
          <Sub>Choose a few, you can refine later.</Sub>
          <Chips all={STACK} value={a.stack} onChange={(v) => set("stack", v)} addPlaceholder="Add another, press Enter" />
          <p className="mt-4 font-mono text-xs text-[#666]">{a.stack.length} selected</p>
          <Actions>
            <Primary onClick={next} disabled={a.stack.length === 0}>Continue</Primary>
          </Actions>
        </>
      );

    case "fact_seconds":
      return (
        <Fact figure="7 seconds" onNext={next}>
          is about how long a recruiter first looks at a resume. We&apos;ll make those seconds count.
        </Fact>
      );

    case "companies":
      return (
        <>
          <Eyebrow>Target companies</Eyebrow>
          <Title>Any companies you&apos;re aiming for?</Title>
          <Sub>Optional, but it sharpens how we tailor your resume.</Sub>
          <Chips all={COMPANIES} value={a.companies} onChange={(v) => set("companies", v)} addPlaceholder="Add a company, press Enter" />
          <Actions skip={next}>
            <Primary onClick={next}>Continue</Primary>
          </Actions>
        </>
      );

    case "location":
      return (
        <>
          <Eyebrow>Location</Eyebrow>
          <Title>Where do you want to work?</Title>
          <div className="mt-6 space-y-2.5">
            {WORK_MODES.map((o) => (
              <OptionButton
                key={o.value}
                selected={a.workModes.includes(o.value)}
                onClick={() => set("workModes", toggle(a.workModes, o.value))}
                check
              >
                {o.label}
              </OptionButton>
            ))}
          </div>
          <label htmlFor="based-in" className="mt-7 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#666]">
            Where are you based?
          </label>
          <TextInput
            id="based-in"
            value={a.basedIn}
            onChange={(v) => set("basedIn", v)}
            placeholder="City or country"
            autoComplete="address-level2"
            maxLength={120}
          />
          <button
            type="button"
            role="switch"
            aria-checked={a.relocate}
            onClick={() => set("relocate", !a.relocate)}
            className="mt-5 flex w-full items-center justify-between text-left text-[15px] text-[#d4d4d4]"
          >
            Open to relocating
            <span className={`relative h-6 w-11 rounded-full transition-colors ${a.relocate ? "bg-[#4ade80]" : "bg-[#262626]"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${a.relocate ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
          <Actions>
            <Primary onClick={next} disabled={a.workModes.length === 0}>Continue</Primary>
          </Actions>
        </>
      );

    case "visa":
      return (
        <>
          <Eyebrow>Work authorization</Eyebrow>
          <Title>Will you need visa sponsorship?</Title>
          <Choices options={VISA} value={a.visa} onPick={choose("visa")} />
        </>
      );

    case "comp": {
      const v = a.compMin ?? 0;
      return (
        <>
          <Eyebrow>Compensation</Eyebrow>
          <Title>What total comp are you targeting?</Title>
          <Sub>Optional. It helps us skip roles below your floor.</Sub>
          <div className="mt-8 text-3xl font-semibold tabular-nums tracking-[-0.03em]">
            {v === 0 ? <span className="text-[#666]">No minimum</span> : `$${v / 1000}k${v === COMP_MAX ? "+" : ""}`}
            {v > 0 && <span className="ml-2 text-base font-normal text-[#666]">a year</span>}
          </div>
          <input
            type="range"
            aria-label="Target total compensation"
            min={0}
            max={COMP_MAX}
            step={COMP_STEP}
            value={v}
            onChange={(e) => set("compMin", Number(e.target.value) || null)}
            className="mt-5 w-full accent-[#4ade80]"
          />
          <Actions skip={() => { set("compMin", null); next(); }}>
            <Primary onClick={next}>Continue</Primary>
          </Actions>
        </>
      );
    }

    case "fact_tailor":
      return (
        <Fact figure="One size fits none." onNext={next}>
          Sending the same resume to every job is the most common reason good engineers don&apos;t
          hear back. Tailoring is where we start.
        </Fact>
      );

    case "stage":
      return (
        <>
          <Eyebrow>Your search</Eyebrow>
          <Title>Where are you in the search?</Title>
          <Choices options={STAGES} value={a.stage} onPick={choose("stage")} />
        </>
      );

    case "blocker":
      return (
        <>
          <Eyebrow>The blocker</Eyebrow>
          <Title>{you("what's slowing you down most?")}</Title>
          <Choices options={BLOCKERS} value={a.blocker} onPick={choose("blocker")} />
        </>
      );

    case "time":
      return (
        <>
          <Eyebrow>Your time</Eyebrow>
          <Title>{you("how much time can you give this each week?")}</Title>
          <Choices options={TIME} value={a.time} onPick={choose("time")} cols={3} />
        </>
      );

    case "resume":
      return <ResumeStep a={a} set={set} next={next} title={you("upload your resume so we can tailor everything to you.")} />;

    case "github":
      return (
        <>
          <Eyebrow>GitHub</Eyebrow>
          <Title>Want to add your GitHub?</Title>
          <Sub>Optional. Great for showing real work, especially early in your career.</Sub>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <div className="mt-6 flex items-center rounded-xl border border-[#1f1f1f] bg-[#111] px-4 focus-within:border-[#4ade80]/60">
              <span className="font-mono text-sm text-[#666]">github.com/</span>
              <input
                aria-label="GitHub username"
                value={a.github}
                onChange={(e) => set("github", e.target.value.replace(/[^a-z\d-]/gi, "").slice(0, 39))}
                placeholder="your-handle"
                autoCapitalize="off"
                spellCheck={false}
                className="h-12 flex-1 bg-transparent pl-1 font-mono text-sm outline-none placeholder:text-[#444]"
              />
            </div>
            <Actions skip={() => { set("github", ""); next(); }}>
              <Primary type="submit">Continue</Primary>
            </Actions>
          </form>
        </>
      );

    case "building":
      return <Building a={a} onDone={() => go("plan")} />;

    case "plan":
      return (
        <PlanView a={a}>
          <div className="mt-10">
            <Primary
              onClick={async () => {
                posthog.capture("onboarding_plan_cta");
                // Already signed in? Finish straight away. Otherwise ask them to sign in.
                if (!(await persist(a))) go("save");
              }}
            >
              Start with step 1
            </Primary>
          </div>
        </PlanView>
      );

    case "save":
      return <SaveStep a={a} />;

    case "saved":
      return (
        <PlanView a={a} saved>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full bg-[#ededed] px-6 text-[15px] font-semibold text-[#0a0a0a] hover:bg-white"
            >
              Go to wowresume
            </Link>
          </div>
        </PlanView>
      );
  }
}

/* ---------- screens with their own state ---------- */

function ResumeStep({ a, set, next, title }: { a: Answers; set: StepProps["set"]; next: () => void; title: string }) {
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setReading(file.name);
    try {
      const text = await readResumeFile(file);
      if (text.trim().split(/\s+/).length < 40) {
        throw new Error("We couldn't read much text from that file. Try another one.");
      }
      set("resumeText", text.slice(0, 60000));
      set("resumeFilename", file.name);
      set("resumeScore", checkResume(text).score);
      posthog.capture("onboarding_resume_uploaded", { type: file.name.split(".").pop() });
      window.setTimeout(next, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read that file.");
    } finally {
      setReading(null);
    }
  };

  return (
    <>
      <Eyebrow>Your resume</Eyebrow>
      <Title>{title}</Title>
      <Sub>Stays private. We use it to write your resumes, and never share it.</Sub>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files[0]);
        }}
        className={`mt-6 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-[#4ade80]/70 bg-[#4ade80]/[0.05]" : "border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#3a3a3a]"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1a1a]">
          {reading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#4ade80]" />
          ) : a.resumeFilename ? (
            <span className="text-[#4ade80]">✓</span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ccc]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
            </svg>
          )}
        </span>
        <span className="mt-4 text-[15px] font-medium">
          {reading ? `Reading ${reading}…` : a.resumeFilename ? a.resumeFilename : "Drop your resume here, or click to choose"}
        </span>
        <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#666]">
          {a.resumeFilename && !reading ? "Click to replace" : "PDF or DOCX"}
        </span>
        {error && <span className="mt-4 text-sm text-[#f87171]">{error}</span>}
      </label>
      <div className="mt-6 flex justify-center gap-6">
        {a.resumeFilename ? (
          <Primary onClick={next}>Continue</Primary>
        ) : (
          <button
            type="button"
            onClick={() => {
              set("resumeText", "");
              set("resumeFilename", "");
              set("resumeScore", null);
              next();
            }}
            className="text-sm text-[#8a8a8a] underline underline-offset-4 hover:text-white"
          >
            I don&apos;t have one yet
          </button>
        )}
      </div>
    </>
  );
}

const BUILD_MS = 750;

function Building({ a, onDone }: { a: Answers; onDone: () => void }) {
  const lines = useMemo(() => {
    const tools = a.stack.slice(0, 2).join(" and ");
    return [
      "reading your background",
      tools ? `mapping ${tools} to roles` : "mapping your skills to roles",
      a.resumeText ? "scoring your resume" : a.github ? `looking at github.com/${a.github}` : "finding what to lead with",
      a.companies[0] ? `matching roles at ${a.companies[0]}` : "sizing up the market",
      "building your plan",
    ];
  }, [a]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setI((n) => n + 1), BUILD_MS);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (i > lines.length) onDone();
  }, [i, lines.length, onDone]);

  return (
    <div aria-live="polite">
      <Eyebrow>Building your plan</Eyebrow>
      <Title>Putting it together.</Title>
      <ul className="mt-8 space-y-3 font-mono text-sm">
        {lines.map((l, n) => (
          <li key={l} className={`flex items-center gap-3 transition-opacity duration-300 ${n > i ? "opacity-0" : n === i ? "opacity-60" : "opacity-100"}`}>
            <span className={n < i ? "text-[#4ade80]" : "text-[#555]"}>{n < i ? "✓" : "›"}</span>
            <span className="text-[#bdbdbd]">{l}</span>
          </li>
        ))}
      </ul>
      <div className="mt-10 h-[3px] overflow-hidden rounded-full bg-[#1c1c1c]">
        <div
          className="h-full rounded-full bg-[#4ade80] transition-[width] ease-linear"
          style={{ width: `${Math.min(100, (i / lines.length) * 100)}%`, transitionDuration: `${BUILD_MS}ms` }}
        />
      </div>
    </div>
  );
}

function PlanView({ a, saved, children }: { a: Answers; saved?: boolean; children: ReactNode }) {
  const plan = useMemo(() => buildPlan(a), [a]);
  const marks = ["Today", "Apply", "Interview", "Offer"];
  return (
    <>
      <Eyebrow>{saved ? "Plan saved on this device" : "Your path"}</Eyebrow>
      {saved && (
        <Title>You&apos;re in{a.firstName.trim() ? `, ${a.firstName.trim()}` : ""}.</Title>
      )}
      <div className={`flex items-start gap-2.5 font-mono text-[15px] ${saved ? "mt-4 text-[#a3a3a3]" : "mt-3"}`}>
        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
        {plan.track}
      </div>

      {!saved && (
        <div className="mt-9">
          <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
            {marks.map((m, n) => (
              <span key={m} className={n === 0 ? "text-[#ededed]" : n === 3 ? "text-[#4ade80]" : "text-[#555]"}>
                {m}
              </span>
            ))}
          </div>
          <div className="relative mt-3 h-3">
            <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-[#2a2a2a]" />
            <div className="animate-grow absolute right-1 top-1/2 h-[2px] w-[30%] origin-left -translate-y-1/2 bg-[#4ade80]" />
            {[0, 1, 2, 3].map((n) => (
              <span
                key={n}
                className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                  n === 0 ? "border-white bg-white" : n === 3 ? "border-[#4ade80] bg-[#4ade80]" : "border-[#555] bg-[#0a0a0a]"
                }`}
                style={{ left: `calc(${(n / 3) * 100}% + ${n === 0 ? 4 : n === 3 ? -4 : 0}px)` }}
              />
            ))}
          </div>
          {plan.months && (
            <div className="mt-3 flex justify-end gap-6 font-mono text-xs">
              {plan.interviewingBy && <span className="text-[#666]">interviewing by {plan.interviewingBy}</span>}
              <span className="text-[#4ade80]">~{plan.months[0]} to {plan.months[1]} months</span>
            </div>
          )}
        </div>
      )}

      <p className={`text-lg leading-snug tracking-[-0.01em] ${saved ? "mt-6 text-[#a3a3a3]" : "mt-8"}`}>
        {saved
          ? "Your plan is saved. Every resume we write for you now starts from these answers."
          : plan.summary}
      </p>
      {!saved && plan.months && (
        <p className="mt-2 text-xs text-[#555]">A rough estimate from your answers. Results vary with the market, effort, and targeting.</p>
      )}

      <ol className="mt-8 divide-y divide-[#1a1a1a] border-y border-[#1a1a1a]">
        {plan.steps.map((s, n) => (
          <li key={s.title} className="flex items-start gap-5 py-5">
            <span className={`pt-0.5 font-mono text-xs ${n === 0 ? "text-[#4ade80]" : "text-[#555]"}`}>
              {String(n + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="mt-1 text-sm text-[#8a8a8a]">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
      {children}
    </>
  );
}

function SaveStep({ a }: { a: Answers }) {
  const plan = useMemo(() => buildPlan(a), [a]);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "google" | "sending" | "sent">("idle");
  const [authError, setAuthError] = useState<string | null>(null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent("/welcome?saved=1")}`;

  const google = async () => {
    setAuthError(null);
    setState("google");
    posthog.capture("onboarding_signin_started", { method: "google" });
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setAuthError("Google sign-in isn't available right now. Use your email instead.");
      setState("idle");
    }
  };

  const magicLink = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setState("sending");
    posthog.capture("onboarding_signin_started", { method: "email" });
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setAuthError("We couldn't send that email. Check the address and try again.");
      setState("idle");
    } else {
      setState("sent");
    }
  };

  return (
    <>
      <Eyebrow>Almost there</Eyebrow>
      <Title>Save your plan.</Title>
      <Sub>
        Create your free account to pick up right where you left off. Your answers and your resume stay
        on this device. We only keep your email.
      </Sub>

      <div className="mt-7 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#666]">Your path</div>
        <div className="mt-2 flex items-start gap-2.5 font-mono text-[15px]">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
          {plan.track}
        </div>
        {plan.months && (
          <div className="mt-1.5 text-sm text-[#8a8a8a]">
            About {plan.months[0]} to {plan.months[1]} months to your target
          </div>
        )}
      </div>

      {state === "sent" ? (
        <div className="mt-7 rounded-2xl border border-[#4ade80]/25 bg-[#4ade80]/[0.04] p-5">
          <div className="font-semibold">Check your email</div>
          <p className="mt-1 text-sm text-[#a3a3a3]">
            We sent a sign-in link to {email.trim()}. Open it on this device to save your plan.
          </p>
          <button type="button" onClick={() => setState("idle")} className="mt-3 text-sm text-[#8a8a8a] underline underline-offset-4 hover:text-white">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={google}
            disabled={state !== "idle"}
            className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#ededed] text-[15px] font-semibold text-[#0a0a0a] transition-colors hover:bg-white disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            {state === "google" ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#555]">
            <span className="h-px flex-1 bg-[#1f1f1f]" />
            or
            <span className="h-px flex-1 bg-[#1f1f1f]" />
          </div>

          <form onSubmit={magicLink} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="save-email" className="sr-only">Email</label>
            <input
              id="save-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 flex-1 rounded-full border border-[#262626] bg-[#111] px-5 text-[15px] outline-none placeholder:text-[#555] focus:border-[#4ade80]/60"
            />
            <button
              type="submit"
              disabled={state !== "idle"}
              className="h-12 rounded-full border border-[#2a2a2a] px-6 text-[15px] font-medium hover:border-[#444] disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Email me a link"}
            </button>
          </form>
        </>
      )}

      {authError && <p className="mt-4 text-sm text-[#f87171]">{authError}</p>}
      <p className="mt-6 text-xs text-[#555]">
        We never store your answers or your resume, and never share your data.{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-[#a3a3a3]">
          Privacy policy
        </Link>
      </p>
    </>
  );
}

/* ---------- building blocks ---------- */

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-[#4ade80]">{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
  return <h1 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">{children}</h1>;
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-[#8a8a8a] sm:text-base">{children}</p>;
}

function Actions({ children, skip }: { children: ReactNode; skip?: () => void }) {
  return (
    <div className={`mt-8 flex items-center ${skip ? "justify-between" : "justify-end"}`}>
      {skip && (
        <button type="button" onClick={skip} className="text-sm text-[#8a8a8a] underline underline-offset-4 hover:text-white">
          Skip
        </button>
      )}
      {children}
    </div>
  );
}

function Primary({ children, onClick, disabled, type = "button" }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#4ade80] px-6 text-[15px] font-semibold text-[#0a0a0a] transition hover:bg-[#6ee7a0] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
      <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-enabled:group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}

function TextInput({ value, onChange, id, ...rest }: {
  value: string; onChange: (v: string) => void; id?: string; placeholder?: string;
  autoFocus?: boolean; autoComplete?: string; maxLength?: number;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={rest.placeholder}
      className="mt-6 h-12 w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 text-[15px] outline-none placeholder:text-[#555] focus:border-[#4ade80]/60"
      {...rest}
    />
  );
}

function OptionButton({ selected, onClick, children, check }: {
  selected: boolean; onClick: () => void; children: ReactNode; check?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-[15px] transition-colors ${
        selected
          ? "border-[#4ade80]/70 bg-[#4ade80]/[0.07] text-white"
          : "border-[#1f1f1f] bg-[#111] text-[#d4d4d4] hover:border-[#333] hover:bg-[#151515]"
      }`}
    >
      {children}
      {check && (
        <span className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${selected ? "border-[#4ade80] bg-[#4ade80] text-[#0a0a0a]" : "border-[#333]"}`}>
          {selected ? "✓" : ""}
        </span>
      )}
    </button>
  );
}

function Choices({ options, value, onPick, cols = 1 }: {
  options: Option[]; value: string; onPick: (v: string) => void; cols?: 1 | 2 | 3;
}) {
  const grid = cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div className={`mt-6 grid gap-2.5 ${grid}`}>
      {options.map((o) => (
        <OptionButton key={o.value} selected={value === o.value} onClick={() => onPick(o.value)}>
          <span className={cols === 3 ? "w-full text-center" : ""}>{o.label}</span>
        </OptionButton>
      ))}
    </div>
  );
}

function Chips({ all, value, onChange, addPlaceholder }: {
  all: string[]; value: string[]; onChange: (v: string[]) => void; addPlaceholder: string;
}) {
  const [draft, setDraft] = useState("");
  const extra = value.filter((v) => !all.includes(v));
  const add = () => {
    const v = draft.trim().slice(0, 60);
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setDraft("");
  };
  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {[...all, ...extra].map((c) => {
          const on = value.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggle(value, c))}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                on ? "border-[#4ade80]/70 bg-[#4ade80]/10 text-white" : "border-[#262626] text-[#a3a3a3] hover:border-[#3a3a3a] hover:text-white"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        aria-label={addPlaceholder}
        placeholder={`+ ${addPlaceholder}`}
        className="mt-5 h-11 w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 text-sm outline-none placeholder:text-[#555] focus:border-[#4ade80]/60"
      />
    </>
  );
}

function Fact({ figure, children, onNext }: { figure: string; children: ReactNode; onNext: () => void }) {
  return (
    <>
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#666]">Did you know</div>
      <div className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[#4ade80] sm:text-6xl">{figure}</div>
      <p className="mt-4 max-w-md text-lg leading-snug text-[#d4d4d4]">{children}</p>
      <button type="button" onClick={onNext} className="mt-8 inline-flex items-center gap-2 text-[15px] text-[#ededed] hover:text-[#4ade80]">
        Continue <span aria-hidden="true">→</span>
      </button>
    </>
  );
}
