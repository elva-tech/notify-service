import type { NextConfig } from 'next';
import path from 'path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const monorepoRoot = path.join(__dirname, '..');

// Standalone output is for Docker/CI only — it breaks `next start` locally and can
// corrupt the dev cache when `next build` runs while `next dev` is still up.
// outputFileTracingRoot is only needed for standalone (monorepo file tracing).
// On Vercel (Root Directory = frontend), setting it to the parent repo breaks routing.
const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  ...(process.env.NEXT_STANDALONE === 'true'
    ? { output: 'standalone' as const, outputFileTracingRoot: monorepoRoot }
    : {}),
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
