import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['three'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-central-1.wasabisys.com',
      },
      {
        protocol: 'https',
        hostname: '**.wasabisys.com',
      },
    ],
  },
};

export default nextConfig;
