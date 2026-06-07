import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { SearchDialog } from '@/components/docs/search-dialog';
import { SiteMobileMenu } from '@/components/navigation/site-mobile-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import type { BusinessManifest } from '@/lib/business-config-types';
import type { DocsManifest } from '@/lib/manifest';
import type { OpenApiManifest } from '@/lib/openapi-loader';
import { docsHref } from '@/lib/paths';

interface SiteHeaderProps {
  docsManifest: DocsManifest;
  openApiManifest: OpenApiManifest;
  businessManifest?: BusinessManifest | null;
  mobileSidebar?: React.ReactNode;
  mobileSidebarTitle?: string;
}

export function SiteHeader({
  docsManifest,
  openApiManifest,
  businessManifest = null,
  mobileSidebar,
  mobileSidebarTitle,
}: SiteHeaderProps) {  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
        <SiteMobileMenu sidebar={mobileSidebar} sidebarTitle={mobileSidebarTitle} />
        <BrandLogo className="min-w-0" />
        <nav className="hidden min-w-0 items-center gap-3 text-sm lg:flex lg:gap-4">
          <Link href={docsHref('')} className="text-muted-foreground hover:text-foreground">
            Documentation
          </Link>
          <Link href="/playground" className="text-muted-foreground hover:text-foreground">
            Playground
          </Link>
          <Link href="/api-reference" className="text-muted-foreground hover:text-foreground">
            API Reference
          </Link>
          <Link href="/platform" className="text-muted-foreground hover:text-foreground">
            Platform
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SearchDialog
            docsManifest={docsManifest}
            openApiManifest={openApiManifest}
            businessManifest={businessManifest}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
