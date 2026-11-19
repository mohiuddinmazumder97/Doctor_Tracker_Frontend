import type { NextConfig } from "next";

/**
 * The browser only ever talks to this app's own origin. Requests to /api/* are
 * proxied server-side to the Express backend, which makes the auth cookie
 * first-party (SameSite=Lax works everywhere, no third-party-cookie issues) and
 * lets proxy.ts see it for route protection.
 *
 * BACKEND_URL is server-only (no NEXT_PUBLIC_ prefix) — it is never sent to the browser.
 */
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      // Tailwind CSS v4 runs as a native Turbopack loader (no PostCSS config needed).
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
