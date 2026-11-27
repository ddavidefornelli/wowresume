import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for route handlers / server actions.
 * Call `await posthog.shutdown()` when done so events flush on serverless.
 */
export function getPostHogServer() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return null;
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}
