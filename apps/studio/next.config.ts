import type { NextConfig } from "next";
import path from "node:path";
// @ts-ignore
import packageJson from "./package.json";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // TypeScript strict mode enabled for production safety
  typescript: {
    ignoreBuildErrors: false,
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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://app-cdn.minepi.com https://*.pi https://pi-blockchain.net;" },
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
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://app-cdn.minepi.com https://pi-blockchain.net https://*.pi;" },
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

export default withBundleAnalyzer(nextConfig);

// Made with Moe Abdelaziz
