import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@lifecalling/ui"],

  // ✅ PRODUÇÃO: Usar WEBPACK padrão (estável)
  // ✅ DESENVOLVIMENTO: Turbopack via "next dev --turbopack"
  ...(process.env.NODE_ENV === "production" ? {} : {
    turbopack: {
      root: path.resolve(__dirname, "../../.."),
    },
  }),

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
