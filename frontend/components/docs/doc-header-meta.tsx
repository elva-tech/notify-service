import Link from 'next/link';
import { BookOpen, Calendar, Target, Users } from 'lucide-react';
import type { DocMeta } from '@/lib/docs-parser';
import type { RelatedDocumentLink } from '@/lib/docs-parser';
import { docsHref } from '@/lib/paths';

interface DocHeaderMetaProps {
  meta: DocMeta | null;
  relatedDocuments: RelatedDocumentLink[];
}

export function DocHeaderMeta({ meta, relatedDocuments }: DocHeaderMetaProps) {
  if (!meta) {
    return null;
  }

  return (
    <section className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        Document Info
      </div>
      <dl className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <dt className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Purpose
          </dt>
          <dd className="text-sm leading-relaxed text-foreground">{meta.purpose}</dd>
        </div>
        <div className="space-y-1">
          <dt className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Intended Audience
          </dt>
          <dd className="text-sm leading-relaxed text-foreground">{meta.intendedAudience}</dd>
        </div>
        <div className="space-y-1">
          <dt className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Last Updated
          </dt>
          <dd className="text-sm text-foreground">{meta.lastUpdated}</dd>
        </div>
        {relatedDocuments.length > 0 && (
          <div className="space-y-1 md:col-span-2">
            <dt className="text-xs font-medium uppercase text-muted-foreground">Related Documents</dt>
            <dd className="flex flex-wrap gap-2">
              {relatedDocuments.map((doc) => (
                <Link
                  key={doc.slug}
                  href={docsHref(doc.slug)}
                  className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent"
                >
                  {doc.title}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
