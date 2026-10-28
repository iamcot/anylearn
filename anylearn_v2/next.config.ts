import type { NextConfig } from "next";

const API_SERVER_ORIGIN = process.env.API_SERVER_ORIGIN || "http://localhost:8080";

const nextConfig: NextConfig = {
  // The round "N" button of `next dev` sits on top of the logo on phones (ngrok testing); errors still show.
  devIndicators: false,

  // Lets a phone open the dev server through ngrok, or through a LAN IP listed in ALLOWED_DEV_ORIGINS.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
  ],

  // The browser calls the API on the same origin (see src/lib/apiBase.ts). In production nginx answers /v2/*
  // before it reaches Next.js; locally Next.js forwards it to the Java server.
  // The worker must never come from an HTTP cache, or a phone keeps the old one for up to 24 hours.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  // Vui học and the class chat used to live under /today: old links, shared banners and stored notifications keep working.
  async redirects() {
    return [
      { source: "/today/fun", destination: "/fun", permanent: true },
      { source: "/today/fun/:path*", destination: "/fun/:path*", permanent: true },
      { source: "/today/community", destination: "/community", permanent: true },
      { source: "/today/community/:path*", destination: "/community/:path*", permanent: true },
    ];
  },

  async rewrites() {
    return [{ source: "/v2/:path*", destination: `${API_SERVER_ORIGIN}/v2/:path*` }];
  },
};

export default nextConfig;
