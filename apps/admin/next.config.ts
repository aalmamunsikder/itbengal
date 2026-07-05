import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },

  transpilePackages: [
    '@itbengal/types',
    '@itbengal/ui',
    '@itbengal/utils',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.itbengal.xyz',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
