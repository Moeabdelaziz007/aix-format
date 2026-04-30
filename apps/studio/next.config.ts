import type { NextConfig } from "next";
import path from "node:path";
// @ts-ignore
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fix monorepo tracing root - pointing to workspace root
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Remove missing package, use relative imports or future-proof with aliases
  transpilePackages: ["@aix-core/storage"], 
  
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Cache mcp-discovery for edge optimization
        source: "/api/mcp-discovery",
        headers: [
          { key: "Cache-Control", value: "public, max-age=10, stale-while-revalidate=50" },
          { key: "CDN-Cache-Control", value: "max-age=60" },
          { key: "Vercel-CDN-Cache-Control", value: "max-age=300, stale-while-revalidate=600" },
        ],
      },
      {
        // Cache static agent pages
        source: "/agents/:id",
        headers: [
          { key: "Cache-Control", value: "s-maxage=60, stale-while-revalidate=300" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
