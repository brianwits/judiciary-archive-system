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

  /** HTML caching and security headers applied to application routes. */
  async headers() {
    return [
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
