import type { NextConfig } from "next";

// One id per deployment: the commit on Vercel, otherwise the build time.
// The service worker and the update check key off it so a new deploy is
// picked up immediately instead of waiting on a manual cache bump.
const APP_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  Date.now().toString(36);

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  // Vercel serverless functions do NOT have `public/` on disk by default.
  // Trace the bundled offline packs into the API lambdas so the DB-less
  // fallbacks keep working in production.
  outputFileTracingIncludes: {
    "/api/*": ["./public/bible/**/*.json"],
  },
  async headers() {
    return [
      {
        // Bundled offline Bible packs are immutable — cache them aggressively.
        source: "/bible/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Always revalidate so a new icon/name/colour shows on the next load.
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
