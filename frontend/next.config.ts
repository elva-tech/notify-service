import type { NextConfig } from 'next';
import path from 'path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Standalone output is for Docker/CI only — it breaks `next start` locally and can
// corrupt the dev cache when `next build` runs while `next dev` is still up.
const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' as const } : {}),
  outputFileTracingRoot: path.join(__dirname, '..'),
  reactStrictMode: true,
  // Avoid Next.js 15.5 devtools segment explorer manifest corruption on Windows (HMR)
  devIndicators: false,
  transpilePackages: ['next-mdx-remote'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@docs': path.join(__dirname, '../docs'),
    };
    return config;
  },
};

export default nextConfig;
