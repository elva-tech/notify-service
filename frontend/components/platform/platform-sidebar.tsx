'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PLATFORM_NAV_ITEMS } from '@/lib/platform-nav.config';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlatformSidebarProps {
  embedded?: boolean;
}

export function PlatformSidebar({ embedded = false }: PlatformSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/platform') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const content = (
      <nav className="space-y-1 pb-8">
        {!embedded ? (
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Platform
          </div>
        ) : null}
        {PLATFORM_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent/60',
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
  );

  if (embedded) {
    return content;
  }

  return <ScrollArea className="h-[calc(100vh-4rem)] pr-4">{content}</ScrollArea>;
}
