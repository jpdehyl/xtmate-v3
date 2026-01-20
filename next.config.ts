import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No external font dependencies - using local fonts only
  // This prevents build failures from Google Fonts CDN
};

export default nextConfig;
