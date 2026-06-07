import { parseMarkdownFile, transformMarkdownLinks } from './docs-parser';
import { slugToSourcePath } from './nav.config';
import { getManifestPage } from './manifest';

export function loadDocBySlug(slug: string) {
  const manifestPage = getManifestPage(slug);
  if (!manifestPage) {
    return null;
  }

  const relativePath = slugToSourcePath(slug);
  const parsed = parseMarkdownFile(relativePath);
  const body = transformMarkdownLinks(parsed.body, relativePath);

  return {
    manifest: manifestPage,
    meta: parsed.meta,
    relatedDocuments: parsed.relatedDocuments,
    body,
    relativePath,
  };
}
