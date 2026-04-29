import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["aix-format"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
