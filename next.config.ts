import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Legacy HR routes → unified /hr module
      { source: "/operations/employees", destination: "/hr/employees", permanent: true },
      { source: "/operations/employees/:path*", destination: "/hr/employees/:path*", permanent: true },
      { source: "/operations/attendance", destination: "/hr/workforce?tab=attendance", permanent: true },
      { source: "/operations/leaves", destination: "/hr/workforce?tab=leaves", permanent: true },
      { source: "/operations/bonuses", destination: "/hr/workforce?tab=bonuses", permanent: true },
      { source: "/finance/hr", destination: "/hr", permanent: true },
      { source: "/finance/hr/:path*", destination: "/hr/:path*", permanent: true },
    ];
  },
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
