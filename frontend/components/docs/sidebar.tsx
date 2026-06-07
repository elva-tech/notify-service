'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, DOCS_HOME } from '@/lib/nav.config';
import { docsHref } from '@/lib/paths';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  embedded?: boolean;
}

export function Sidebar({ embedded = false }: SidebarProps) {
  const pathname = usePathname();

  function itemHref(item: (typeof NAV_SECTIONS)[number]['items'][number]) {
    if (item.href) {
      return item.href;
    }
    if (item.slug) {
      return docsHref(item.slug);
    }
    return '#';
  }

  function isActive(item: (typeof NAV_SECTIONS)[number]['items'][number]) {
    const href = itemHref(item);
    if (item.href?.startsWith('/api-reference')) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href || pathname === `${href}/`;
  }

  const content = (
      <nav className="space-y-6 pb-8">
        <div>
          <Link
            href={docsHref('')}
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === docsHref('') || pathname === `${docsHref('')}/`
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/60',
            )}
          >
            {DOCS_HOME.title}
          </Link>
        </div>
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`}>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const itemKey = item.slug ?? item.href ?? `${section.title}-${item.title}-${itemIndex}`;
                if (item.disabled || (!item.slug && !item.href)) {
                  return (
                    <div
                      key={itemKey}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground"
                    >
                      <span>{item.title}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={itemKey}
                    href={itemHref(item)}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm transition-colors',
                      isActive(item)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent/60',
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
  );

  if (embedded) {
    return content;
  }

  return <ScrollArea className="h-[calc(100vh-4rem)] pr-4">{content}</ScrollArea>;
}
