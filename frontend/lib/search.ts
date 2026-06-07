import type { DocsManifest } from './manifest';

export interface SearchResult {
  title: string;
  slug: string;
  href: string;
  snippet: string;
}

export function searchManifest(manifest: DocsManifest, query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  return manifest.pages
    .map((page) => {
      const haystack = `${page.title} ${page.searchText}`.toLowerCase();
      const idx = haystack.indexOf(q);
      if (idx === -1) {
        return null;
      }

      const rawSnippet = page.searchText.slice(Math.max(0, idx - 40), idx + 80);
      const snippet = rawSnippet.length < page.searchText.length ? `…${rawSnippet}…` : rawSnippet;

      return {
        title: page.title,
        slug: page.slug,
        href: page.slug ? `/docs/${page.slug}` : '/docs',
        snippet: snippet.trim(),
      };
    })
    .filter((item): item is SearchResult => item !== null)
    .slice(0, limit);
}
