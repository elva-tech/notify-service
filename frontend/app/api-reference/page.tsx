import { ApiReferenceLanding } from '@/components/api/api-reference-landing';
import { readOpenApiManifest } from '@/lib/openapi-loader';

export default function ApiReferencePage() {
  const manifest = readOpenApiManifest();
  return <ApiReferenceLanding manifest={manifest} />;
}
