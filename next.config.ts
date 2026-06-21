import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    /** Tree-shake icon / chart / component packages at compile time (smaller dev + prod bundles). */
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
    /** Allow the documented 25 MB case-document limit plus multipart overhead. */
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },

  /**
   * Security & caching headers applied to all routes.
   * Static assets (/_next/static) get aggressive immutable caching.
   * HTML pages get short TTL with stale-while-revalidate for fast back-navigation.
   */
  async headers() {
    return [
      {
        // Next.js already sets immutable caching for /_next/static/*, but we ensure
        // it explicitly here. public/ dir assets aren't fingerprinted so skip them.
        source: "/_next/static/:path*",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path(\.html?$)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/((?!_next/static|favicon\.ico).*)",
        locale: false,
        missing: [
          {
            type: "header",
            key: "next-router-prefetch",
          },
        ],
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
