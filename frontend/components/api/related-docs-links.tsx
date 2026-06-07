import Link from 'next/link';
import type { OpenApiRelatedDoc } from '@/lib/openapi-loader';

interface RelatedDocsLinksProps {
  links: OpenApiRelatedDoc[];
}

export function RelatedDocsLinks({ links }: RelatedDocsLinksProps) {
  if (!links.length) {
    return null;
  }

  return (
    <section className="mb-8 rounded-lg border bg-muted/30 p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Related documentation
      </h2>
      <ul className="flex flex-wrap gap-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-primary underline-offset-4 hover:underline">
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
