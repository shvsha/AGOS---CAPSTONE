import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "192.168.1.6",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${process.env.BACKEND_URL}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;