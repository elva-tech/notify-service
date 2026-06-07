import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { SiteHeader } from '@/components/docs/site-header';

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <SiteHeader docsManifest={docsManifest} openApiManifest={openApiManifest} />
      <main className="px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
