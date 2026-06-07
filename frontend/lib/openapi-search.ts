import type { OpenApiManifest } from './openapi-loader';

export interface OpenApiSearchResult {
  title: string;
  slug: string;
  href: string;
  snippet: string;
  kind: 'api';
  method: string;
  path: string;
}

export function searchOpenApiManifest(
  manifest: OpenApiManifest,
  query: string,
  limit = 8,
): OpenApiSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  return manifest.operations
    .map((op) => {
      const haystack = `${op.method} ${op.path} ${op.summary} ${op.operationId} ${op.tags.join(' ')} ${op.requestSchemaNames.join(' ')} ${op.responses.flatMap((r) => r.schemaNames).join(' ')} ${op.searchText}`.toLowerCase();
      const idx = haystack.indexOf(q);
      if (idx === -1) {
        return null;
      }

      const snippetSource = op.summary || op.description.slice(0, 120);
      const snippet = `${op.method} ${op.path} — ${snippetSource}`;

      return {
        title: `${op.method} ${op.path}`,
        slug: op.slug,
        href: `/api-reference/${op.slug}`,
        snippet: snippet.trim(),
        kind: 'api' as const,
        method: op.method,
        path: op.path,
      };
    })
    .filter((item): item is OpenApiSearchResult => item !== null)
    .slice(0, limit);
}
