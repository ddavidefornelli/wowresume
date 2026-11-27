import type { NextConfig } from "next";

const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // PostHog reverse proxy
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/ingest/array/:path*", destination: `${posthogAssetsHost}/array/:path*` },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
