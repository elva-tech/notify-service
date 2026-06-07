/**
 * Bundles backend/openapi/openapi.yaml and writes frontend/.generated/openapi-manifest.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SwaggerParser from '@apidevtools/swagger-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const openapiPath = path.join(frontendRoot, '..', 'backend', 'openapi', 'openapi.yaml');
const manifestPath = path.join(frontendRoot, '.generated', 'openapi-manifest.json');

function operationSlug(method, pathKey) {
  const normalized = pathKey.replace(/^\//, '').replace(/\//g, '-').replace(/[{}]/g, '');
  return `${method.toLowerCase()}-${normalized || 'root'}`;
}

function extractSchemaNameFromRef(ref) {
  if (typeof ref !== 'string') {
    return null;
  }

  const componentsMatch = ref.match(/#\/components\/schemas\/([A-Za-z0-9_-]+)$/);
  if (componentsMatch) {
    return componentsMatch[1];
  }

  const leaf = ref.split('/').pop();
  if (!leaf || /^\d+$/.test(leaf) || leaf === 'schema' || leaf === 'items') {
    return null;
  }

  if (/^[A-Z]/.test(leaf)) {
    return leaf;
  }

  return null;
}

function collectSchemaNames(obj, names = new Set()) {
  if (!obj || typeof obj !== 'object') {
    return names;
  }

  if (obj.$ref && typeof obj.$ref === 'string') {
    const refName = extractSchemaNameFromRef(obj.$ref);
    if (refName) {
      names.add(refName);
    }
  }

  if (Array.isArray(obj.oneOf)) {
    obj.oneOf.forEach((item) => collectSchemaNames(item, names));
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectSchemaNames(item, names));
    } else if (value && typeof value === 'object') {
      collectSchemaNames(value, names);
    }
  }

  return names;
}

function serializeExamples(content) {
  if (!content?.examples) {
    return [];
  }
  return Object.entries(content.examples).map(([name, example]) => ({
    name,
    summary: example.summary ?? name,
    value: example.value ?? example,
  }));
}

function serializeResponses(responses) {
  if (!responses) {
    return [];
  }
  return Object.entries(responses).map(([status, response]) => {
    const jsonContent = response.content?.['application/json'];
    const schemaNames = jsonContent?.schema ? [...collectSchemaNames(jsonContent.schema)] : [];
    return {
      status,
      description: response.description ?? '',
      schemaNames,
      example: jsonContent?.example ?? jsonContent?.examples?.default?.value ?? null,
    };
  });
}

function buildSearchText(operation, pathKey, method) {
  const parts = [
    pathKey,
    method,
    operation.operationId ?? '',
    operation.summary ?? '',
    operation.description ?? '',
    ...(operation.tags ?? []),
  ];

  if (operation.requestBody?.content?.['application/json']?.schema) {
    parts.push(...collectSchemaNames(operation.requestBody.content['application/json'].schema));
  }

  for (const response of Object.values(operation.responses ?? {})) {
    const schema = response.content?.['application/json']?.schema;
    if (schema) {
      parts.push(...collectSchemaNames(schema));
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const bundled = await SwaggerParser.bundle(openapiPath);

const operations = [];

for (const [pathKey, pathItem] of Object.entries(bundled.paths ?? {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const operation = pathItem[method];
    if (!operation) {
      continue;
    }

    const requestContent = operation.requestBody?.content?.['application/json'];
    const requestExamples = serializeExamples(requestContent);
    let requestSchemaNames = requestContent?.schema ? [...collectSchemaNames(requestContent.schema)] : [];
    if (requestSchemaNames.length === 0 && requestExamples.length > 0) {
      requestSchemaNames = requestExamples.map((example) => example.summary || example.name);
    }

    operations.push({
      operationId: operation.operationId ?? operationSlug(method, pathKey),
      slug: operationSlug(method, pathKey),
      method: method.toUpperCase(),
      path: pathKey,
      summary: operation.summary ?? '',
      description: operation.description ?? '',
      tags: operation.tags ?? [],
      authRequired: operation['x-elva-auth']?.required ?? false,
      relatedDocs: operation['x-related-docs'] ?? [],
      requestExamples,
      requestSchemaNames,
      responses: serializeResponses(operation.responses),
      searchText: buildSearchText(operation, pathKey, method),
    });
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  version: bundled.info?.version ?? '1.0.0',
  title: bundled.info?.title ?? 'ELVA Notify API',
  description: bundled.info?.description ?? '',
  operations,
};

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
  `Generated OpenAPI manifest with ${operations.length} operations → frontend/.generated/openapi-manifest.json`,
);
