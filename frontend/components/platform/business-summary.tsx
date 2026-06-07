import type { BusinessConfig } from '@/lib/business-config-types';
import { CodeBlock } from '@/components/docs/code-block';

interface BusinessSummaryProps {
  business: BusinessConfig;
}

export function BusinessSummary({ business }: BusinessSummaryProps) {
  const metadata = {
    businessId: business.businessId,
    displayName: business.displayName,
    version: business.version,
  };

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">Business metadata</h2>
      <CodeBlock code={JSON.stringify(metadata, null, 2)} language="json" />
    </section>
  );
}
