import { PlatformSidebar } from '@/components/platform/platform-sidebar';

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:gap-8 sm:px-4 sm:py-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <PlatformSidebar />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
