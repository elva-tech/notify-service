import { DOCS_HOME, findSectionTitleForSlug } from './nav.config';
import { docsHref } from './paths';
import type { ManifestEntry } from './manifest';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbs(page: ManifestEntry): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Docs', href: docsHref('') },
  ];

  if (!page.slug) {
    items.push({ label: DOCS_HOME.title });
    return items;
  }

  const section = findSectionTitleForSlug(page.slug);
  if (section) {
    items.push({ label: section });
  }

  items.push({ label: page.title });
  return items;
}
