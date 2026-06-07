/**
 * Validates backend/openapi/openapi.yaml (development tooling only).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import SwaggerParser from '@apidevtools/swagger-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.join(__dirname, '..', '..', 'backend', 'openapi', 'openapi.yaml');

try {
  await SwaggerParser.validate(openapiPath);
  console.log(`OpenAPI spec is valid: ${openapiPath}`);
} catch (err) {
  console.error('OpenAPI validation failed:', err.message ?? err);
  process.exit(1);
}
