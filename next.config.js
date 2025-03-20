/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Desabilita SSR (Server Side Rendering)
  reactStrictMode: true,
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig; 