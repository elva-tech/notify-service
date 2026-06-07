import type { BusinessManifest } from './business-config-types';
import { searchBusinessManifest, type BusinessSearchResult } from './business-search';
import type { DocsManifest } from './manifest';
import type { OpenApiManifest } from './openapi-loader';
import { searchManifest, type SearchResult } from './search';
import { searchOpenApiManifest, type OpenApiSearchResult } from './openapi-search';

export type UnifiedSearchResult =
  | (SearchResult & { kind: 'doc' })
  | OpenApiSearchResult
  | BusinessSearchResult;

export function searchAll(
  docsManifest: DocsManifest,
  openApiManifest: OpenApiManifest,
  businessManifest: BusinessManifest,
  query: string,
  limit = 20,
): UnifiedSearchResult[] {
  const perGroup = Math.max(3, Math.floor(limit / 4));

  const docs = searchManifest(docsManifest, query, perGroup).map((item) => ({
    ...item,
    kind: 'doc' as const,
  }));

  const apis = searchOpenApiManifest(openApiManifest, query, perGroup);
  const businesses = searchBusinessManifest(businessManifest, query, perGroup);

  return [...docs, ...apis, ...businesses].slice(0, limit);
}
