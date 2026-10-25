import type { NextConfig } from "next";

const API_SERVER_ORIGIN = process.env.API_SERVER_ORIGIN || "http://localhost:8080";

const nextConfig: NextConfig = {
  // Lets a phone open the dev server through ngrok, or through a LAN IP listed in ALLOWED_DEV_ORIGINS.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
  ],

  // The browser calls the API on the same origin (see src/lib/apiBase.ts). In production nginx answers /v2/*
  // before it reaches Next.js; locally Next.js forwards it to the Java server.
  async rewrites() {
    return [{ source: "/v2/:path*", destination: `${API_SERVER_ORIGIN}/v2/:path*` }];
  },
};

export default nextConfig;
