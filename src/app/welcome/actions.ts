"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BLOCKERS, COMP_MAX, EXPERIENCE, GOALS, ROLES, SITUATIONS, STAGES, TIME, VISA, WORK_MODES,
  type Answers, type Option,
} from "@/lib/onboarding";

export type SaveResult = { ok: true } | { ok: false; reason: "signed_out" | "error" };

const pick = (list: Option[], v: unknown) =>
  typeof v === "string" && list.some((o) => o.value === v) ? v : null;
const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
const tags = (v: unknown, maxItems: number) =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)))]
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

/** Saves the onboarding answers to the signed-in user's profile. */
export async function saveOnboarding(a: Answers): Promise<SaveResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false, reason: "signed_out" };

  const comp = typeof a.compMin === "number" && Number.isFinite(a.compMin)
    ? Math.max(0, Math.min(COMP_MAX, Math.round(a.compMin)))
    : null;
  const github = text(a.github, 39)?.replace(/^@/, "") ?? null;

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: text(a.firstName, 60),
    goal: pick(GOALS, a.goal),
    situation: pick(SITUATIONS, a.situation),
    experience: pick(EXPERIENCE, a.experience),
    role: pick(ROLES, a.role),
    stack: tags(a.stack, 30),
    target_companies: tags(a.companies, 20),
    work_modes: tags(a.workModes, 3).filter((m) => WORK_MODES.some((o) => o.value === m)),
    based_in: text(a.basedIn, 120),
    open_to_relocate: a.relocate === true,
    visa: pick(VISA, a.visa),
    comp_min: comp || null,
    search_stage: pick(STAGES, a.stage),
    blocker: pick(BLOCKERS, a.blocker),
    weekly_time: pick(TIME, a.time),
    github: github && /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(github) ? github : null,
    resume_text: text(a.resumeText, 60000),
    resume_filename: text(a.resumeFilename, 200),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveOnboarding:", error.message);
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}
