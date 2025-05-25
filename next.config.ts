import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during production builds to prevent blocking deploys
  eslint: {
    ignoreDuringBuilds: true,
  },
  // other config options here
};

export default nextConfig;