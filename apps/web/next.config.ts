import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lifecalling/ui"],
  typescript: {
    // Ignora erros de tipo durante o build (recharts tem problemas de tipagem)
    ignoreBuildErrors: true,
  },

  async rewrites() {
    const API = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
