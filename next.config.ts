import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const allowedDevOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address?.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};

export default nextConfig;
