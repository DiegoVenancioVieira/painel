/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um servidor Node mínimo (.next/standalone) para imagem Docker enxuta.
  output: "standalone",
  // Demos Flutter Web (em /public/mulher e /public/viatura): a entrada sem
  // arquivo precisa resolver para o index.html. Os assets (main.dart.js, etc.)
  // são servidos direto de /public pelo caminho. Flutter usa URL-strategy por
  // hash, então não há deep-links de servidor a tratar.
  async rewrites() {
    return [
      { source: "/mulher", destination: "/mulher/index.html" },
      { source: "/mulher/", destination: "/mulher/index.html" },
      { source: "/viatura", destination: "/viatura/index.html" },
      { source: "/viatura/", destination: "/viatura/index.html" },
    ];
  },
};

export default nextConfig;
