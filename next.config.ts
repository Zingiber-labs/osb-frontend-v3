import type { NextConfig } from "next";

console.log("NEXT_CONFIG: Loading configuration...");

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['three'],
  images: {
    unoptimized: true,
    domains: [
      's3.us-central-1.wasabisys.com',
      'wasabisys.com',
      'example.com',
      'cdn.example.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-central-1.wasabisys.com',
      },
      {
        protocol: 'https',
        hostname: '**.wasabisys.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  optimizeFonts: false,
};

export default nextConfig;
