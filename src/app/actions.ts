"use server";

import { createClient } from "@supabase/supabase-js";

export type LeadState = { ok: boolean; error?: string; email?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Saves an email from the free resume check. Only the email and score are stored, never the resume. */
export async function saveLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const score = Number(formData.get("score"));

  if (email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, error: "That email doesn't look right.", email };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("saveLead: Supabase is not configured");
    return { ok: false, error: "Something went wrong. Please try again.", email };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("leads").upsert(
    {
      email,
      source: "resume_check",
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    },
    { onConflict: "email", ignoreDuplicates: true },
  );

  if (error) {
    console.error("saveLead:", error.message);
    return { ok: false, error: "Something went wrong. Please try again.", email };
  }
  return { ok: true };
}
