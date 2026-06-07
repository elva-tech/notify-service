import Link from 'next/link';
import { fetchPlatformManifest } from '@/lib/platform-api';
import { MermaidDiagram } from '@/components/docs/mermaid-diagram';
import { PlatformOverview } from '@/components/platform/platform-overview';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ARCHITECTURE_CHART = `flowchart TB
    CFG[Business Config JSON]
    REG[Business Registry]
    VAL[Template Validation]
    DLT[DLT Payload Resolver]
    API[Notify API]

    CFG --> REG
    REG --> VAL
    VAL --> DLT
    DLT --> API`;

export default async function PlatformPage() {
  const manifest = await fetchPlatformManifest();

  return (
    <article>
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Business Operations Platform</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Read-only view of business configurations, DLT mappings, templates, and validation schemas
          from <code className="rounded bg-muted px-1">backend/config/businesses/</code>.
        </p>
        <div className="mt-4">
          <Link href="/platform/businesses" className={cn(buttonVariants())}>
            Browse businesses
          </Link>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Overview</h2>
        <PlatformOverview stats={manifest.stats} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Configuration flow</h2>
        <MermaidDiagram chart={ARCHITECTURE_CHART} />
      </section>
    </article>
  );
}
