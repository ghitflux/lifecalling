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
    // Para SSR/rewrites do servidor Next.js, usar API_BASE_URL (interno do Docker)
    // Para o browser (client-side), NEXT_PUBLIC_API_BASE_URL é usado automaticamente
    const API = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    if (!API) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
