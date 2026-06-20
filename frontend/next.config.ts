import type { NextConfig } from 'next';
import path from 'path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const monorepoRoot = path.join(__dirname, '..');

// Standalone output is for Docker/CI only — it breaks `next start` locally and can
// corrupt the dev cache when `next build` runs while `next dev` is still up.
// outputFileTracingRoot: monorepo parent for local dev/standalone (docs + openapi paths).
// Omit on Vercel — Root Directory = frontend; parent tracing breaks deployment routing.
const tracingRoot =
  process.env.VERCEL === '1'
    ? {}
    : { outputFileTracingRoot: monorepoRoot };

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  ...tracingRoot,
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' as const } : {}),
  // Dynamic routes (e.g. /platform) read manifests at request time on Vercel lambdas.
  outputFileTracingIncludes: {
    '/platform': ['./.generated/**/*'],
    '/platform/*': ['./.generated/**/*'],
    '/platform/**/*': ['./.generated/**/*'],
  },
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
