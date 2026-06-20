import { readManifest } from '@/lib/manifest';
import { readOpenApiManifest } from '@/lib/openapi-loader';
import { SiteHeader } from '@/components/docs/site-header';

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  const docsManifest = readManifest();
  const openApiManifest = readOpenApiManifest();

  return (
    <div className="min-h-screen">
      <SiteHeader docsManifest={docsManifest} openApiManifest={openApiManifest} />
      <main className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-12">{children}</main>
    </div>
  );
}
