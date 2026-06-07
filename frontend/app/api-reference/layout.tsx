import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { ApiReferenceSidebar } from '@/components/api/api-reference-sidebar';
import { SiteHeader } from '@/components/docs/site-header';
import { ApiReferenceShell } from '@/components/api/api-reference-shell';

export default function ApiReferenceLayout({ children }: { children: React.ReactNode }) {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <SiteHeader
        docsManifest={docsManifest}
        openApiManifest={openApiManifest}
        mobileSidebar={<ApiReferenceSidebar operations={openApiManifest.operations} embedded />}
        mobileSidebarTitle="API endpoints"
      />
      <ApiReferenceShell>{children}</ApiReferenceShell>
    </div>
  );
}
