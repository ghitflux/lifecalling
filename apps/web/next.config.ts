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
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
