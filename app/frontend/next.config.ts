import type { NextConfig } from "next";

// Adresse du serveur Django (réseau interne en production).
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  // Django attend des URL avec barre finale : on ne laisse pas Next la retirer.
  skipTrailingSlashRedirect: true,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Le navigateur ne parle qu'à Next ; /api est relayé vers Django (cookies de session en même origine).
    return [
      // Avec barre finale (convention de Django), puis sans.
      { source: "/api/:path*/", destination: `${BACKEND_URL}/api/:path*/` },
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
    ];
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
