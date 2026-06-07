import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPlatformBusiness } from '@/lib/platform-api';
import { BusinessSummary } from '@/components/platform/business-summary';
import { DltSummary } from '@/components/platform/dlt-summary';
import { TemplateTable } from '@/components/platform/template-table';
import { VariableTable } from '@/components/platform/variable-table';

export const dynamic = 'force-dynamic';

interface BusinessDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { businessId } = await params;
  const business = await fetchPlatformBusiness(businessId);

  if (!business) {
    notFound();
  }

  const allVariables = business.templates.flatMap((template) =>
    template.variables.map((variable) => ({
      ...variable,
      templateKey: template.templateKey,
    })),
  );

  return (
    <article>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/platform/businesses" className="hover:text-foreground">
          Businesses
        </Link>
        <span className="mx-2">/</span>
        <span>{business.displayName}</span>
      </nav>

      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">{business.displayName}</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {business.businessId} · {business.version}
        </p>
      </header>

      <BusinessSummary business={business} />
      <DltSummary dlt={business.dlt} />
      <TemplateTable business={business} />

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">All variable definitions</h2>
        <div className="space-y-6">
          {business.templates.map((template) => (
            <div key={template.templateKey}>
              <h3 className="mb-2 font-mono text-sm font-semibold">{template.templateKey}</h3>
              <VariableTable variables={template.variables} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">Summary</h2>
        <p className="text-sm text-muted-foreground">
          {business.templates.length} templates · {allVariables.length} total variable slots · Sender{' '}
          <span className="font-mono">{business.dlt.defaultSenderId}</span> · Entity{' '}
          <span className="font-mono">{business.dlt.entityId}</span>
        </p>
      </section>
    </article>
  );
}
