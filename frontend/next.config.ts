import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' and basePath for development
  // output: 'export',
  // basePath: '/defi-city',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;


