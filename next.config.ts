import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@reinas/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@reinas/ui"],
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
