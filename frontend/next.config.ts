import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/defi-city',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;


