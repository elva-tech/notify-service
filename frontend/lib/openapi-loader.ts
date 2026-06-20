import fs from 'fs';
import path from 'path';
import { FRONTEND_ROOT } from './paths';
import bundledOpenApiManifest from '../.generated/openapi-manifest.json';

export interface OpenApiRequestExample {
  name: string;
  summary: string;
  value: unknown;
}

export interface OpenApiResponseEntry {
  status: string;
  description: string;
  schemaNames: string[];
  example: unknown | null;
}

export interface OpenApiRelatedDoc {
  title: string;
  href: string;
}

export interface OpenApiOperation {
  operationId: string;
  slug: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  authRequired: boolean;
  relatedDocs: OpenApiRelatedDoc[];
  requestExamples: OpenApiRequestExample[];
  requestSchemaNames: string[];
  responses: OpenApiResponseEntry[];
  searchText: string;
}

export interface OpenApiManifest {
  generatedAt: string;
  version: string;
  title: string;
  description: string;
  operations: OpenApiOperation[];
}

export const OPENAPI_MANIFEST_PATH = path.join(FRONTEND_ROOT, '.generated', 'openapi-manifest.json');

/** Bundled at build time (prebuild). fs fallback supports local scripts only. */
export function readOpenApiManifest(): OpenApiManifest {
  try {
    const raw = fs.readFileSync(OPENAPI_MANIFEST_PATH, 'utf8');
    return JSON.parse(raw) as OpenApiManifest;
  } catch {
    return bundledOpenApiManifest as OpenApiManifest;
  }
}

export function getOpenApiOperation(slug: string): OpenApiOperation | undefined {
  const manifest = readOpenApiManifest();
  return manifest.operations.find((op) => op.slug === slug);
}

export function getAllOpenApiSlugs(): string[] {
  return readOpenApiManifest().operations.map((op) => op.slug);
}

export function getOperationsByTag(manifest: OpenApiManifest): Map<string, OpenApiOperation[]> {
  const map = new Map<string, OpenApiOperation[]>();
  for (const op of manifest.operations) {
    const tag = op.tags[0] ?? 'Other';
    const list = map.get(tag) ?? [];
    list.push(op);
    map.set(tag, list);
  }
  return map;
}
