import { notFound } from 'next/navigation';
import { loadDocBySlug } from '@/lib/docs-loader';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { getPrevNext } from '@/lib/prev-next';
import { compileDocumentBody } from '@/lib/mdx-compile';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { DocHeaderMeta } from '@/components/docs/doc-header-meta';
import { PrevNext } from '@/components/docs/prev-next';

interface DocPageProps {
  slug: string;
}

export async function DocPage({ slug }: DocPageProps) {
  const doc = loadDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  const breadcrumbs = buildBreadcrumbs(doc.manifest);
  const { prev, next } = getPrevNext(slug);
  const content = await compileDocumentBody(doc.body, slug || 'docs-home');

  return (
    <article>
      <Breadcrumbs items={breadcrumbs} />
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{doc.manifest.title}</h1>
      </header>
      <DocHeaderMeta meta={doc.meta} relatedDocuments={doc.relatedDocuments} />
      <div className="prose prose-slate max-w-none overflow-x-auto text-foreground dark:prose-invert prose-headings:scroll-mt-24 prose-p:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground prose-strong:text-foreground prose-table:block">
        {content}
      </div>
      <PrevNext prev={prev} next={next} />
    </article>
  );
}
