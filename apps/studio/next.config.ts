import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  transpilePackages: ["../../core"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@core": path.resolve(__dirname, "../../core"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@core": "../../core",
    },
  },
};

export default nextConfig;
