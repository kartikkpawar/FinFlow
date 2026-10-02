import type { NextConfig } from "next";

const API_GATEWAY_URL = process.env.FINFLOW_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_GATEWAY_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
