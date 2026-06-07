import { docsHref } from './paths';
import { readManifest } from './manifest';

export interface PrevNextLink {
  title: string;
  href: string;
  slug: string;
}

export function getPrevNext(slug: string): {
  prev: PrevNextLink | null;
  next: PrevNextLink | null;
} {
  const manifest = readManifest();
  const index = manifest.pages.findIndex((page) => page.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  const prevPage = index > 0 ? manifest.pages[index - 1] : null;
  const nextPage = index < manifest.pages.length - 1 ? manifest.pages[index + 1] : null;

  return {
    prev: prevPage
      ? { title: prevPage.title, href: docsHref(prevPage.slug), slug: prevPage.slug }
      : null,
    next: nextPage
      ? { title: nextPage.title, href: docsHref(nextPage.slug), slug: nextPage.slug }
      : null,
  };
}
