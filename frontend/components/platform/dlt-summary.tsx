import type { BusinessDltConfig } from '@/lib/business-config-types';
import { CodeBlock } from '@/components/docs/code-block';

interface DltSummaryProps {
  dlt: BusinessDltConfig;
}

export function DltSummary({ dlt }: DltSummaryProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">DLT configuration</h2>
      <CodeBlock
        code={JSON.stringify(
          {
            entityId: dlt.entityId,
            defaultSenderId: dlt.defaultSenderId,
          },
          null,
          2,
        )}
        language="json"
      />
    </section>
  );
}
