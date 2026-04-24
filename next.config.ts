import type { NextConfig } from "next";

console.log("NEXT_CONFIG: Loading configuration...");

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['three'],
  images: {
    unoptimized: true,
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
        hostname: 'cdn.example.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "asynckit": false,
        "combined-stream": false,
        "form-data": false,
      };
    }
    return config;
  },
  // @ts-ignore - Required for Next.js 16 when using webpack config
  turbopack: {},
};

export default nextConfig;
