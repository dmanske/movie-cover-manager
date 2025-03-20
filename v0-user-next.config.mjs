/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Necessário para o Electron
  images: {
    unoptimized: true, // Necessário para o Electron
  },
  // Desabilitar algumas otimizações que podem causar problemas no Electron
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }
    return config;
  },
}

export default nextConfig;

