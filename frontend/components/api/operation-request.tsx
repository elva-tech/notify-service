import type { OpenApiRequestExample } from '@/lib/openapi-loader';
import { CodeBlock } from '@/components/docs/code-block';

interface OperationRequestProps {
  examples: OpenApiRequestExample[];
  schemaNames: string[];
  authRequired: boolean;
}

export function OperationRequest({ examples, schemaNames, authRequired }: OperationRequestProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">Request</h2>
      {authRequired ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Requires <code className="rounded bg-muted px-1">appId</code> and{' '}
          <code className="rounded bg-muted px-1">apiKey</code> in the JSON body.
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No authentication required.</p>
      )}
      {schemaNames.length > 0 ? (
        <p className="mb-4 text-xs text-muted-foreground">Schemas: {schemaNames.join(', ')}</p>
      ) : null}
      {examples.length > 0 ? (
        <div className="space-y-4">
          {examples.map((example) => (
            <div key={example.name}>
              <h3 className="mb-2 text-sm font-medium">{example.summary}</h3>
              <CodeBlock code={JSON.stringify(example.value, null, 2)} language="json" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No request body.</p>
      )}
    </section>
  );
}
