/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true
  },
  webpack: (config, { isServer }) => {
    // Disable webpack filesystem cache to prevent the ENOENT error
    if (!isServer) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;