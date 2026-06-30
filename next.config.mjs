/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um servidor Node mínimo (.next/standalone) para imagem Docker enxuta.
  output: "standalone",
};

export default nextConfig;
