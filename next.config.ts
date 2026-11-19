import type { NextConfig } from "next";

/**
 * The browser only ever talks to this app's own origin. Requests to /api/* are
 * proxied server-side to the Express backend, which makes the auth cookie
 * first-party (SameSite=Lax works everywhere, no third-party-cookie issues) and
 * lets proxy.ts see it for route protection.
 *
 * BACKEND_URL is server-only (no NEXT_PUBLIC_ prefix) — it is never sent to the browser.
 */
function resolveBackendUrl(raw: string | undefined): string {
  // Tolerate common dashboard paste mistakes: whitespace, quotes, a missing scheme,
  // trailing slashes, or a trailing /api (the rewrite adds /api itself).
  let value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!value) return "http://localhost:5000";
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  value = value.replace(/\/+$/, "").replace(/\/api$/i, "");
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    throw new Error(
      `BACKEND_URL is not a valid URL. Set it to the API origin, e.g. https://your-api.onrender.com`,
    );
  }
}

const backendUrl = resolveBackendUrl(process.env.BACKEND_URL);

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
