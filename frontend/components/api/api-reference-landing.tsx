import Link from 'next/link';
import type { OpenApiManifest } from '@/lib/openapi-loader';
import { getOperationsByTag } from '@/lib/openapi-loader';
import { MethodBadge } from '@/components/api/method-badge';

interface ApiReferenceLandingProps {
  manifest: OpenApiManifest;
}

export function ApiReferenceLanding({ manifest }: ApiReferenceLandingProps) {
  const byTag = getOperationsByTag(manifest);

  return (
    <article>
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">API Reference</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Machine-readable contract for the ELVA Notify backend API (OpenAPI 3.1). For narrative
          guides, see{' '}
          <Link href="/docs/api/authentication" className="text-primary underline-offset-4 hover:underline">
            Authentication
          </Link>
          ,{' '}
          <Link href="/docs/api/otp" className="text-primary underline-offset-4 hover:underline">
            OTP
          </Link>
          , and{' '}
          <Link href="/docs/api/notify" className="text-primary underline-offset-4 hover:underline">
            Notify
          </Link>
          .
        </p>
      </header>

      <section className="mb-8 rounded-lg border bg-muted/30 p-4">
        <h2 className="text-sm font-semibold text-foreground">Note: backend root page</h2>
        <p className="mt-1 text-sm text-foreground/80">
          <code className="rounded bg-background px-1">GET /</code> on the backend serves a static HTML
          landing page. It is not part of this OpenAPI contract.
        </p>
      </section>

      <div className="space-y-8">
        {[...byTag.entries()].map(([tag, operations]) => (
          <section key={tag}>
            <h2 className="mb-4 text-xl font-semibold">{tag}</h2>
            <div className="divide-y rounded-lg border">
              {operations.map((op) => (
                <Link
                  key={op.slug}
                  href={`/api-reference/${op.slug}`}
                  className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <MethodBadge method={op.method} />
                    <code className="truncate font-mono text-sm">{op.path}</code>
                  </div>
                  <span className="text-sm text-muted-foreground">{op.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
