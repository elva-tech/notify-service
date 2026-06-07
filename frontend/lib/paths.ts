import path from 'path';

export const FRONTEND_ROOT = path.join(process.cwd());
export const DOCS_ROOT = path.join(FRONTEND_ROOT, '..', 'docs');
export const MANIFEST_PATH = path.join(FRONTEND_ROOT, '.generated', 'docs-manifest.json');

export function docsFilePath(relativePath: string): string {
  return path.join(DOCS_ROOT, relativePath);
}

/** App-relative docs path. Next.js basePath (next.config) prefixes automatically. */
export function docsHref(slug: string): string {
  if (!slug) {
    return '/docs';
  }
  return `/docs/${slug}`;
}
