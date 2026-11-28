"use client";

import posthog from "posthog-js";
import { useActionState, useEffect, useRef, useState } from "react";
import { checkResume, type ResumeReport } from "@/lib/resume-check";
import { readResumeFile } from "@/lib/read-resume-file";
import { saveLead, type LeadState } from "./actions";

const ACCENT = "#4ade80";
const FREE_CHECKS = 3; // checks shown before the email unlock
const STEP_MS = 650;
const ANALYZE_STEPS = [
  "Reading your resume",
  "Looking for numbers that show results",
  "Spotting weak, vague phrases",
  "Checking how your bullets start",
  "Finding your projects and links",
  "Counting the tech you used",
  "Checking length",
];

const SAMPLE = `Jordan Lee
jordan.lee@email.com

Education
B.S. Computer Science, State University, 2026

Experience
Software Intern, Local Startup (Summer 2025)
- Responsible for fixing bugs in the web app
- Worked on the new signup page with the team
- Helped with writing tests

Projects
Chat App
- I made a chat app using React and Firebase
- Users can send messages in real time

Weather Dashboard
- Built a weather dashboard with Python and Flask that pulls data from a public API

Skills
JavaScript, Python, React, HTML, CSS, Git
Hard-working team player, passionate about technology`;

export function ResumeChecker() {
  const [text, setText] = useState("");
  const [report, setReport] = useState<ResumeReport | null>(null);
  const [step, setStep] = useState<number | null>(null); // analyzing progress
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timerRef.current), []);
  const [pasting, setPasting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [lead, formAction, pending] = useActionState<LeadState, FormData>(saveLead, { ok: false });

  useEffect(() => {
    if (lead.ok) posthog.capture("resume_check_unlocked", { score: report?.score });
  }, [lead.ok, report?.score]);

  const run = (value: string) => {
    const r = checkResume(value);
    posthog.capture("resume_checked", { score: r.score, words: r.words });
    setReport(null);
    setStep(0);
    requestAnimationFrame(() =>
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    // Walk through each check so it feels like a real read, then show the result.
    window.clearInterval(timerRef.current);
    let i = 0;
    const timer = (timerRef.current = window.setInterval(() => {
      i += 1;
      if (i < ANALYZE_STEPS.length) {
        setStep(i);
      } else {
        window.clearInterval(timer);
        setStep(null);
        setReport(r);
      }
    }, STEP_MS));
  };

  const tooShort = text.trim().split(/\s+/).length < 40;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    setReading(file.name);
    try {
      const extracted = await readResumeFile(file);
      if (extracted.trim().split(/\s+/).length < 40) {
        throw new Error("We couldn't read much text from that file. Try pasting it instead.");
      }
      setText(extracted);
      run(extracted);
      posthog.capture("resume_file_read", { type: file.name.split(".").pop() });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "We couldn't read that file.");
    } finally {
      setReading(null);
    }
  };

  return (
    <section id="check" className="w-full max-w-4xl scroll-mt-10 text-left">
      <div className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-[#4ade80]">
        Free tool!
      </div>
      <h2 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.05em] sm:text-6xl">
        Find out what&apos;s wrong with your resume.
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#8a8a8a] sm:text-xl">
        Drop it in and get a free score in seconds. We check what recruiters look at first: numbers
        that show results, strong verbs, and your projects.
      </p>

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
        className={`mt-10 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed px-6 py-12 text-center transition-colors ${
          dragging
            ? "border-[#4ade80]/70 bg-[#4ade80]/[0.05]"
            : "border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#3a3a3a]"
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
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
          {reading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#4ade80]" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ccc]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
            </svg>
          )}
        </span>
        <span className="mt-5 text-lg font-medium text-[#ededed]">
          {reading ? `Reading ${reading}…` : "Drop your resume, or click to choose"}
        </span>
        <span className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-[#666]">PDF or DOCX</span>
        {fileError && <span className="mt-4 text-sm text-[#f87171]">{fileError}</span>}
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPasting((p) => !p)}
            className="text-[#8a8a8a] hover:text-white"
          >
            {pasting ? "hide text box" : "or paste your text"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText(SAMPLE);
              run(SAMPLE);
            }}
            className="text-[#666] underline underline-offset-4 hover:text-white"
          >
            try an example
          </button>
        </div>
        <span className="flex items-center gap-2 text-[#8a8a8a]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Read in your browser, never stored.
        </span>
      </div>

      {pasting && (
        <div className="mt-4">
          <label htmlFor="resume" className="sr-only">
            Your resume text
          </label>
          <textarea
            id="resume"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Open your resume, select all, copy, and paste it here."
            className="w-full resize-y rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-4 font-mono text-sm text-[#ddd] outline-none placeholder:text-[#555] focus:border-[#4ade80]/60"
          />
          <button
            type="button"
            disabled={tooShort}
            onClick={() => run(text)}
            className="mt-3 rounded-full bg-[#4ade80] px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#6ee7a0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check my resume
          </button>
        </div>
      )}

      {step !== null && (
        <div
          id="report"
          className="mt-6 scroll-mt-10 rounded-[20px] border border-[#1f1f1f] bg-[#0f0f0f] p-5 sm:p-8"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#4ade80]" />
            <span className="font-medium">Checking your resume…</span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#1c1c1c]">
            <div
              className="h-full rounded-full bg-[#4ade80] transition-[width] duration-500 ease-out"
              style={{ width: `${((step + 1) / ANALYZE_STEPS.length) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2 font-mono text-sm">
            {ANALYZE_STEPS.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  i > step ? "opacity-25" : "opacity-100"
                }`}
              >
                <span className={i < step ? "text-[#4ade80]" : "text-[#666]"}>
                  {i < step ? "✓" : i === step ? "›" : "·"}
                </span>
                <span className={i === step ? "text-[#ededed]" : "text-[#8a8a8a]"}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report && (
        <div id="report" className="mt-6 scroll-mt-10 rounded-[20px] border border-[#1f1f1f] bg-[#0f0f0f] p-5 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <ScoreRing score={report.score} />
            <div className="text-center sm:text-left">
              <div className="text-2xl font-semibold tracking-[-0.03em]">{verdict(report.score)}</div>
              <p className="mt-1 text-[#a3a3a3]">
                {report.checks.filter((c) => !c.pass).length === 0
                  ? "Nice. Every check passed."
                  : (() => {
                      const n = report.checks.filter((c) => !c.pass).length;
                      return n === 1
                        ? "1 thing is holding your resume back."
                        : `${n} things are holding your resume back.`;
                    })()}
              </p>
            </div>
          </div>

          <ul className="mt-6 divide-y divide-[#1a1a1a] border-t border-[#1a1a1a]">
            {report.checks.map((c, i) => (
              <li
                key={c.id}
                aria-hidden={!lead.ok && i >= FREE_CHECKS ? true : undefined}
                className={`py-3 ${
                  !lead.ok && i >= FREE_CHECKS ? "pointer-events-none select-none blur-[5px]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      c.pass ? "bg-[#4ade80] text-[#0a0a0a]" : "bg-[#f87171]/15 text-[#f87171]"
                    }`}
                  >
                    {c.pass ? "✓" : "✕"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">{c.label}</span>
                      <span className="font-mono text-xs text-[#666]">{c.detail}</span>
                    </div>
                    {!c.pass && lead.ok && (
                      <div className="mt-2 text-sm text-[#a3a3a3]">
                        {c.fix}
                        {c.examples && c.examples.length > 0 && (
                          <ul className="ph-no-capture mt-2 space-y-1">
                            {c.examples.map((e) => (
                              <li
                                key={e}
                                className="rounded-md border-l-2 border-[#f87171]/50 bg-[#141414] px-3 py-1.5 font-mono text-xs text-[#888]"
                              >
                                {e}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!lead.ok && (
            <form
              action={formAction}
              className="mt-6 rounded-xl border border-[#4ade80]/25 bg-[#4ade80]/[0.04] p-5"
            >
              <div className="font-semibold">
                See the other {report.checks.length - FREE_CHECKS} checks and how to fix each one
              </div>
              <p className="mt-1 text-sm text-[#a3a3a3]">
                Get the exact lines to change and how to rewrite them. Free, just add your email.
              </p>
              <input type="hidden" name="score" value={report.score} />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="lead-email" className="sr-only">
                  Email
                </label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={lead.email}
                  key={lead.email}
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-[#262626] bg-[#141414] px-4 py-2.5 text-sm outline-none placeholder:text-[#555] focus:border-[#4ade80]/60"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-[#ededed] px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-white disabled:opacity-60"
                >
                  {pending ? "Unlocking…" : "Show me the fixes"}
                </button>
              </div>
              {lead.error && <p className="mt-2 text-sm text-[#f87171]">{lead.error}</p>}
              <p className="mt-3 text-xs text-[#666]">
                We&apos;ll also tell you when wowresume can rewrite it for you. Unsubscribe anytime.{" "}
                <a href="/privacy" className="underline underline-offset-4 hover:text-[#a3a3a3]">
                  Privacy policy
                </a>
              </p>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

function verdict(score: number) {
  if (score >= 85) return "Strong resume";
  if (score >= 60) return "Good start, needs work";
  return "Needs a lot of work";
}

const SCORE_MS = 3500;

/** Counts up from 0 to `target` with an ease-out curve. */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / SCORE_MS, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function ScoreRing({ score: target }: { score: number }) {
  const score = useCountUp(target);
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? ACCENT : score >= 60 ? "#facc15" : "#f87171";
  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1c1c1c" strokeWidth="9" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-semibold tabular-nums">{score}</span>
        <span className="font-mono text-[10px] text-[#666]">/ 100</span>
      </div>
    </div>
  );
}
