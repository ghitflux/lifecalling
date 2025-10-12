import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // output: 'standalone', // Required for Docker deployment - temporarily disabled for Windows build
  transpilePackages: ["@lifecalling/ui"],
  // Enable Turbopack for development
  turbopack: {
    // Turbopack configuration
    // Most transformations are handled automatically by Turbopack
    root: path.resolve(__dirname, "../../.."), // Point to the workspace root to avoid multiple lockfiles warning
  },
  async rewrites() {
    // Em produção você aponta NEXT_PUBLIC_API_BASE_URL para o domínio real da API
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
