import Link from 'next/link';
import type { BusinessTemplate } from '@/lib/business-config-types';
import { CodeBlock } from '@/components/docs/code-block';
import { VariableTable } from '@/components/platform/variable-table';
import { docsHref } from '@/lib/paths';

interface TemplateDetailsProps {
  businessId: string;
  displayName: string;
  template: BusinessTemplate;
}

export function TemplateDetails({ businessId, displayName, template }: TemplateDetailsProps) {
  return (
    <article>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/platform/businesses" className="hover:text-foreground">
          Businesses
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/platform/businesses/${businessId}`} className="hover:text-foreground">
          {displayName}
        </Link>
        <span className="mx-2">/</span>
        <span>{template.templateKey}</span>
      </nav>

      <header className="mb-8 border-b pb-6">
        <h1 className="font-mono text-3xl font-bold tracking-tight">{template.templateKey}</h1>
        <p className="mt-2 text-muted-foreground">{template.purpose}</p>
      </header>

      <section className="mb-8 rounded-lg border bg-muted/20 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Related documentation
        </h2>
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/api-reference/post-notify" className="text-primary hover:underline">
              API Reference — POST /notify
            </Link>
          </li>
          <li>
            <Link href={docsHref('api/notify')} className="text-primary hover:underline">
              Notify documentation
            </Link>
          </li>
          <li>
            <Link href={docsHref('architecture/dlt-layer')} className="text-primary hover:underline">
              DLT documentation
            </Link>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">DLT mapping</h2>
        <CodeBlock
          code={JSON.stringify(
            {
              messageId: template.messageId ?? template.templateId,
              templateId: template.templateId,
              senderId: template.senderId,
              entityId: template.entityId,
            },
            null,
            2,
          )}
          language="json"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Variables</h2>
        <VariableTable variables={template.variables} />
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Example notify payload</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Read-only example for integrators. Not a live API call.
        </p>
        <CodeBlock code={JSON.stringify(template.examplePayload, null, 2)} language="json" />
      </section>
    </article>
  );
}
