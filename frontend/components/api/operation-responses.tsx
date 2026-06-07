import type { OpenApiResponseEntry } from '@/lib/openapi-loader';
import { CodeBlock } from '@/components/docs/code-block';

interface OperationResponsesProps {
  responses: OpenApiResponseEntry[];
}

export function OperationResponses({ responses }: OperationResponsesProps) {
  if (!responses.length) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">Responses</h2>
      <div className="space-y-6">
        {responses.map((response) => (
          <div key={response.status} className="rounded-lg border p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-sm font-semibold">
                {response.status}
              </span>
              <span className="text-sm text-muted-foreground">{response.description}</span>
            </div>
            {response.schemaNames.length > 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">
                Schemas: {response.schemaNames.join(', ')}
              </p>
            ) : null}
            {response.example ? (
              <CodeBlock code={JSON.stringify(response.example, null, 2)} language="json" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
