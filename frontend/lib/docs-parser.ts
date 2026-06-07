import fs from 'fs';
import path from 'path';
import { DOCS_ROOT } from './paths';

export interface DocMeta {
  purpose: string;
  intendedAudience: string;
  lastUpdated: string;
  relatedDocuments: string;
}

export interface RelatedDocumentLink {
  title: string;
  href: string;
  slug: string;
}

export interface DocHeading {
  level: number;
  text: string;
  id: string;
}

export interface ParsedDocFile {
  title: string;
  sourcePath: string;
  relativePath: string;
  meta: DocMeta | null;
  headings: DocHeading[];
  relatedDocuments: RelatedDocumentLink[];
  body: string;
}

const META_ROW_PATTERN = /^\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|$/;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function resolveRelativeLink(currentRelative: string, linkTarget: string): string {
  const currentDir = path.dirname(currentRelative);
  const resolved = path.normalize(path.join(currentDir, linkTarget));
  return resolved.replace(/\\/g, '/');
}

function relativePathToSlug(relativePath: string): string {
  if (relativePath === 'README.md') {
    return '';
  }
  return relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
}

export function parseRelatedDocuments(
  raw: string,
  currentRelative: string,
): RelatedDocumentLink[] {
  const links: RelatedDocumentLink[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null = pattern.exec(raw);

  while (match) {
    const title = match[1].trim();
    const href = match[2].trim();
    if (!href.endsWith('.md')) {
      match = pattern.exec(raw);
      continue;
    }
    const resolved = resolveRelativeLink(currentRelative, href);
    links.push({
      title,
      href: `/docs/${relativePathToSlug(resolved)}`.replace(/\/docs\/$/, '/docs'),
      slug: relativePathToSlug(resolved),
    });
    match = pattern.exec(raw);
  }

  return links;
}

function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = /^(#{2,4})\s+(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, '').trim();
    headings.push({ level, text, id: slugify(text) });
  }

  return headings;
}

function parseMetaTable(lines: string[], relativePath: string): {
  meta: DocMeta | null;
  endIndex: number;
  relatedDocuments: RelatedDocumentLink[];
} {
  let meta: DocMeta | null = null;
  let endIndex = 0;
  let relatedDocuments: RelatedDocumentLink[] = [];

  const tableStart = lines.findIndex((line, idx) => {
    if (idx + 1 >= lines.length) {
      return false;
    }
    return line.trim() === '| | |' && lines[idx + 1].trim().startsWith('|---');
  });

  if (tableStart === -1) {
    return { meta, endIndex, relatedDocuments };
  }

  const rows: Record<string, string> = {};
  let i = tableStart + 2;

  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const rowMatch = META_ROW_PATTERN.exec(lines[i].trim());
    if (rowMatch) {
      rows[rowMatch[1].trim()] = rowMatch[2].trim();
    }
    i += 1;
  }

  if (Object.keys(rows).length > 0) {
    meta = {
      purpose: rows.Purpose ?? '',
      intendedAudience: rows['Intended Audience'] ?? '',
      lastUpdated: rows['Last Updated'] ?? '',
      relatedDocuments: rows['Related Documents'] ?? '',
    };
    relatedDocuments = parseRelatedDocuments(meta.relatedDocuments, relativePath);
  }

  while (endIndex < lines.length && (lines[endIndex].trim() !== '---' || endIndex <= i)) {
    endIndex += 1;
  }

  if (lines[endIndex]?.trim() === '---') {
    endIndex += 1;
  }

  return { meta, endIndex, relatedDocuments };
}

export function parseMarkdownFile(relativePath: string): ParsedDocFile {
  const sourcePath = path.join(DOCS_ROOT, relativePath);
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const titleMatch = /^#\s+(.+)$/.exec(lines.find((l) => l.startsWith('# ')) ?? '');
  const title = titleMatch ? titleMatch[1].trim() : relativePath;

  const { meta, endIndex, relatedDocuments } = parseMetaTable(lines, relativePath);
  const body = lines.slice(endIndex).join('\n').trim();
  const headings = extractHeadings(body);

  return {
    title,
    sourcePath: path.relative(path.join(DOCS_ROOT, '..'), sourcePath).replace(/\\/g, '/'),
    relativePath,
    meta,
    headings,
    relatedDocuments,
    body,
  };
}

export function transformMarkdownLinks(markdown: string, currentRelative: string): string {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, href) => {
    if (typeof href !== 'string' || !href.endsWith('.md')) {
      return full;
    }
    const resolved = resolveRelativeLink(currentRelative, href);
    const slug = relativePathToSlug(resolved);
    const url = slug ? `/docs/${slug}` : '/docs';
    return `[${label}](${url})`;
  });
}

export function splitMermaidSegments(markdown: string): Array<
  | { type: 'markdown'; content: string }
  | { type: 'mermaid'; content: string }
> {
  const segments: Array<
    | { type: 'markdown'; content: string }
    | { type: 'mermaid'; content: string }
  > = [];
  const pattern = /```mermaid\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = pattern.exec(markdown);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'markdown',
        content: markdown.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: 'mermaid', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(markdown);
  }

  if (lastIndex < markdown.length) {
    segments.push({ type: 'markdown', content: markdown.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'markdown', content: markdown });
  }

  return segments;
}
