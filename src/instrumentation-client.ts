import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(token, {
    // Events go through our own /ingest rewrite (see next.config.ts) so ad-blockers don't drop them.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com",
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV !== "production") {
  console.warn(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set: PostHog is disabled and events are not captured.",
  );
}
