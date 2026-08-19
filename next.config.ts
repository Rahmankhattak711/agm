import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const proxyTarget = process.env.API_PROXY_URL;
    if (!proxyTarget) return [];

    return [
      {
        source: "/api/proxy/:path*",
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
