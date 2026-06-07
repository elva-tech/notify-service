import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOpenApiOperation, readOpenApiManifest } from '@/lib/openapi-loader';
import { MethodBadge } from '@/components/api/method-badge';
import { OperationDescription } from '@/components/api/operation-description';
import { OperationRequest } from '@/components/api/operation-request';
import { OperationResponses } from '@/components/api/operation-responses';
import { RelatedDocsLinks } from '@/components/api/related-docs-links';

interface ApiOperationPageProps {
  slug: string;
}

export async function ApiOperationPage({ slug }: ApiOperationPageProps) {
  const operation = getOpenApiOperation(slug);
  if (!operation) {
    notFound();
  }

  const manifest = readOpenApiManifest();
  const index = manifest.operations.findIndex((op) => op.slug === slug);
  const prev = index > 0 ? manifest.operations[index - 1] : null;
  const next = index < manifest.operations.length - 1 ? manifest.operations[index + 1] : null;

  return (
    <article>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/api-reference" className="hover:text-foreground">
          API Reference
        </Link>
        <span className="mx-2">/</span>
        <span>{operation.tags[0]}</span>
      </nav>

      <header className="mb-8 border-b pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <MethodBadge method={operation.method} />
          <code className="break-all font-mono text-sm sm:text-lg">{operation.path}</code>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{operation.summary}</h1>
        {operation.description ? <OperationDescription markdown={operation.description} /> : null}
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          operationId: {operation.operationId}
        </p>
      </header>

      <RelatedDocsLinks links={operation.relatedDocs} />
      <OperationRequest
        examples={operation.requestExamples}
        schemaNames={operation.requestSchemaNames}
        authRequired={operation.authRequired}
      />
      <OperationResponses responses={operation.responses} />

      <nav className="mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/api-reference/${prev.slug}`} className="text-sm hover:text-primary">
            ← {prev.method} {prev.path}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/api-reference/${next.slug}`}
            className="text-sm hover:text-primary sm:text-right"
          >
            {next.method} {next.path} →
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
