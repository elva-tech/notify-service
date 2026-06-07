import fs from 'fs';
import path from 'path';
import { DOCS_HOME, getNavFlatItems, slugToSourcePath } from './nav.config';
import { parseMarkdownFile } from './docs-parser';
import { MANIFEST_PATH } from './paths';

export interface ManifestEntry {
  title: string;
  slug: string;
  sourcePath: string;
  headings: Array<{ level: number; text: string; id: string }>;
  relatedDocuments: Array<{ title: string; href: string; slug: string }>;
  lastUpdated: string;
  searchText: string;
}

export interface DocsManifest {
  generatedAt: string;
  version: string;
  pages: ManifestEntry[];
}

export function buildManifest(): DocsManifest {
  const pages: ManifestEntry[] = [];
  const navItems = getNavFlatItems();

  for (const item of navItems) {
    const relativePath = slugToSourcePath(item.slug);
    const parsed = parseMarkdownFile(relativePath);

    const searchText = [
      parsed.title,
      parsed.meta?.purpose ?? '',
      parsed.meta?.intendedAudience ?? '',
      parsed.headings.map((h) => h.text).join(' '),
      parsed.body.replace(/```[\s\S]*?```/g, ' '),
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      title: parsed.title || item.title,
      slug: item.slug,
      sourcePath: parsed.sourcePath,
      headings: parsed.headings,
      relatedDocuments: parsed.relatedDocuments,
      lastUpdated: parsed.meta?.lastUpdated ?? '',
      searchText,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    pages,
  };
}

export function writeManifest(manifest: DocsManifest): void {
  const dir = path.dirname(MANIFEST_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function readManifest(): DocsManifest {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw) as DocsManifest;
}

export function getManifestPage(slug: string): ManifestEntry | undefined {
  const manifest = readManifest();
  return manifest.pages.find((page) => page.slug === slug);
}

export function getAllManifestSlugs(): string[] {
  const manifest = readManifest();
  return manifest.pages.map((page) => page.slug);
}

export { DOCS_HOME };
