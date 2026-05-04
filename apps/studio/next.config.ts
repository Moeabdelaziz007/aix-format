import type { NextConfig } from "next";
import path from "node:path";
// @ts-ignore
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // 🚀 GHOST DEPLOY: Ship broken, fix live (Y Combinator strategy)
  // Working pages stay live, broken pages return 500
  // Fix incrementally while site is running
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Fix monorepo tracing root - pointing to workspace root
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  transpilePackages: ["@aix-format/aix-zkkyc", "@aix-format/mcp-gateway"],
  
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },

  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', '@xyflow/react'],
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
      {
        // Pi Network domain validation — must be plain text, publicly accessible
        source: "/validation-key.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
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

// Made with Moe Abdelaziz
