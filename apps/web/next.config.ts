import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // output: 'standalone', // Required for Docker deployment - temporarily disabled for Windows build
  transpilePackages: ["@lifecalling/ui"],
  // Enable Turbopack for development
  turbopack: {
    // Point to the workspace root - use absolute path /app for Docker
    root: process.env.NODE_ENV === 'production' ? '/app' : path.resolve(__dirname, "../../.."),
  },
};

export default nextConfig;
