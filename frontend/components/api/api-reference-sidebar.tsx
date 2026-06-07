'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MethodBadge } from '@/components/api/method-badge';
import type { OpenApiOperation } from '@/lib/openapi-loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ApiReferenceSidebarProps {
  operations: OpenApiOperation[];
  embedded?: boolean;
}

export function ApiReferenceSidebar({ operations, embedded = false }: ApiReferenceSidebarProps) {
  const pathname = usePathname();

  const grouped = operations.reduce<Record<string, OpenApiOperation[]>>((acc, op) => {
    const tag = op.tags[0] ?? 'Other';
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(op);
    return acc;
  }, {});

  const content = (
    <nav className="space-y-6 pb-8">
      {!embedded ? (
        <Link
          href="/api-reference"
          className={cn(
            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/api-reference' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
          )}
        >
          API Reference Home
        </Link>
      ) : null}

      {Object.entries(grouped).map(([tag, ops]) => (
        <div key={tag}>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tag}
          </div>
          <div className="space-y-1">
            {ops.map((op) => {
              const href = `/api-reference/${op.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={op.slug}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/60',
                  )}
                >
                  <MethodBadge method={op.method} className="shrink-0" />
                  <span className="truncate font-mono text-xs">{op.path}</span>
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
