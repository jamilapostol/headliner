import type { NextConfig } from "next";
import { baselineCsp } from "./src/lib/csp";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        // Enforced everywhere. proxy.ts adds the stricter nonce policy on the
        // authenticated routes as Report-Only, which is a separate header, so
        // the two never conflict.
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: baselineCsp(process.env.NODE_ENV === "development") }],
      },
    ];
  },
};

export default nextConfig;
