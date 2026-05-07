import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["4.145.80.120"],
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
