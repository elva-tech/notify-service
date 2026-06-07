import { Sidebar } from '@/components/docs/sidebar';

interface DocsShellProps {
  children: React.ReactNode;
}

export function DocsShell({ children }: DocsShellProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:gap-8 sm:px-4 sm:py-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
