import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@osb/gameplay"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "s3.us-central-1.wasabisys.com" },
      { protocol: "https", hostname: "**.wasabisys.com" },
      { protocol: "https", hostname: "example.com" },
      { protocol: "https", hostname: "cdn.example.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        asynckit: false,
        "combined-stream": false,
        "form-data": false,
      };
    }
    return config;
  },
};

export default nextConfig;
