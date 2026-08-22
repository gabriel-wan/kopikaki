import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};

export default nextConfig;
