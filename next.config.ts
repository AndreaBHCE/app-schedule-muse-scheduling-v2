import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ── Images ──────────────────────────────────────────── */
  images: {
    remotePatterns: [
      // Clerk user avatars
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      // Zoom profile pictures
      { protocol: "https", hostname: "**.zoom.us" },
    ],
  },

  /* ── Server-side Node.js packages ────────────────────── */
  serverExternalPackages: ["crypto"],

  /* ── Security headers ────────────────────────────────── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;