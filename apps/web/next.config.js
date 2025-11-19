/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de tipo durante o build (recharts tem problemas de tipagem)
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
