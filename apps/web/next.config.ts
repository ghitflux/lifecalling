import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lifecalling/ui"],
  // Enable Turbopack for development
  turbopack: {
    // Turbopack configuration
    // Most transformations are handled automatically by Turbopack
  },
  async rewrites() {
    // Em produção você aponta NEXT_PUBLIC_API_BASE_URL para o domínio real da API
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8001/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
