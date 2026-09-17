import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
