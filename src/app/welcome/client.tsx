"use client";

import dynamic from "next/dynamic";

// The flow restores saved answers from localStorage on its first render, so it only renders in the browser.
export const OnboardingClient = dynamic(() => import("./onboarding").then((m) => m.Onboarding), {
  ssr: false,
  loading: () => <div className="min-h-svh bg-[#0a0a0a]" />,
});
