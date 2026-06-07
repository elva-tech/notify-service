import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { PlatformHeader } from '@/components/platform/platform-header';
import { PlatformShell } from '@/components/platform/platform-shell';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <PlatformHeader
        docsManifest={docsManifest}
        openApiManifest={openApiManifest}
        mobileSidebar={<PlatformSidebar embedded />}
      />
      <PlatformShell>{children}</PlatformShell>
    </div>
  );
}
