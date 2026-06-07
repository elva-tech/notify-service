import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { SiteHeader } from '@/components/docs/site-header';
import { DocsShell } from '@/components/docs/docs-shell';
import { Sidebar } from '@/components/docs/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <SiteHeader
        docsManifest={docsManifest}
        openApiManifest={openApiManifest}
        mobileSidebar={<Sidebar embedded />}
        mobileSidebarTitle="Documentation"
      />
      <DocsShell>{children}</DocsShell>
    </div>
  );
}
