'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { docsHref } from '@/lib/paths';
import { cn } from '@/lib/utils';

const SITE_LINKS = [
  { href: docsHref(''), label: 'Documentation' },
  { href: '/playground', label: 'Playground' },
  { href: '/api-reference', label: 'API Reference' },
  { href: '/platform', label: 'Platform' },
] as const;

interface SiteMobileMenuProps {
  sidebar?: React.ReactNode;
  sidebarTitle?: string;
}

export function SiteMobileMenu({ sidebar, sidebarTitle = 'Section navigation' }: SiteMobileMenuProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-1.5rem,20rem)] overflow-y-auto p-0 pt-12">
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <nav className="space-y-1 border-b px-4 pb-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ELVA Notify
          </p>
          {SITE_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-md px-3 py-2.5 text-sm transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/60',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {sidebar ? (
          <div className="px-2 py-4">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {sidebarTitle}
            </p>
            {sidebar}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
