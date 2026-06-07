import { readOpenApiManifest } from '@/lib/openapi-loader';
import { ApiReferenceSidebar } from '@/components/api/api-reference-sidebar';

interface ApiReferenceShellProps {
  children: React.ReactNode;
}

export function ApiReferenceShell({ children }: ApiReferenceShellProps) {
  const manifest = readOpenApiManifest();

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:gap-8 sm:px-4 sm:py-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <ApiReferenceSidebar operations={manifest.operations} />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
