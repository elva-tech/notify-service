/**
 * Manifest generator entrypoint (plain Node, no tsx required).
 * Duplicates nav slugs and invokes parsing via dynamic import fallback.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const docsRoot = path.join(frontendRoot, '..', 'docs');
const manifestPath = path.join(frontendRoot, '.generated', 'docs-manifest.json');

const NAV_ITEMS = [
  { title: 'Documentation Home', slug: '', file: 'README.md' },
  { title: 'End-to-End Integration Guide', slug: 'getting-started/end-to-end-integration-guide', file: 'getting-started/end-to-end-integration-guide.md' },
  { title: 'Overview', slug: 'architecture/overview', file: 'architecture/overview.md' },
  { title: 'Request Lifecycle', slug: 'architecture/request-lifecycle', file: 'architecture/request-lifecycle.md' },
  { title: 'DLT Layer', slug: 'architecture/dlt-layer', file: 'architecture/dlt-layer.md' },
  { title: 'OTP DLT Migration', slug: 'architecture/otp-dlt-migration', file: 'architecture/otp-dlt-migration.md' },
  { title: 'OTP DLT Observability', slug: 'architecture/otp-dlt-observability', file: 'architecture/otp-dlt-observability.md' },
  { title: 'OTP DLT Outage', slug: 'runbooks/otp-dlt-outage', file: 'runbooks/otp-dlt-outage.md' },
  { title: 'OTP DLT Rollback', slug: 'runbooks/otp-dlt-rollback', file: 'runbooks/otp-dlt-rollback.md' },
  { title: 'OTP DLT Rollout', slug: 'runbooks/otp-dlt-rollout', file: 'runbooks/otp-dlt-rollout.md' },
  { title: 'OTP DLT Log Triage', slug: 'runbooks/otp-dlt-log-triage', file: 'runbooks/otp-dlt-log-triage.md' },
  { title: 'OTP DLT Retirement Readiness', slug: 'runbooks/otp-dlt-retirement-readiness', file: 'runbooks/otp-dlt-retirement-readiness.md' },
  { title: 'Authentication', slug: 'api/authentication', file: 'api/authentication.md' },
  { title: 'OTP', slug: 'api/otp', file: 'api/otp.md' },
  { title: 'Notify', slug: 'api/notify', file: 'api/notify.md' },
  { title: 'Error Codes', slug: 'api/error-codes', file: 'api/error-codes.md' },
  { title: 'OpenAPI Specification', slug: 'api/openapi', file: 'api/openapi.md' },
  { title: 'API Reference', slug: 'api/reference', file: 'api/reference.md' },
  { title: 'ApnaKart Templates', slug: 'businesses/apnakart', file: 'businesses/apnakart.md' },
  { title: 'Business Onboarding Guide', slug: 'businesses/onboarding-guide', file: 'businesses/onboarding-guide.md' },
  { title: 'Business Configuration Reference', slug: 'businesses/configuration-reference', file: 'businesses/configuration-reference.md' },
  { title: 'Business Validation Rules', slug: 'businesses/validation-rules', file: 'businesses/validation-rules.md' },
  { title: 'Business Governance', slug: 'architecture/business-governance', file: 'architecture/business-governance.md' },
  { title: 'Business Onboarding Runbook', slug: 'runbooks/business-onboarding', file: 'runbooks/business-onboarding.md' },
  { title: 'Business Validation Failure', slug: 'runbooks/business-validation-failure', file: 'runbooks/business-validation-failure.md' },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function resolveRelativeLink(currentRelative, linkTarget) {
  const currentDir = path.dirname(currentRelative);
  return path.normalize(path.join(currentDir, linkTarget)).replace(/\\/g, '/');
}

function relativePathToSlug(relativePath) {
  if (relativePath === 'README.md') return '';
  return relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
}

function parseRelatedDocuments(raw, currentRelative) {
  const links = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match = pattern.exec(raw);
  while (match) {
    const title = match[1].trim();
    const href = match[2].trim();
    if (href.endsWith('.md')) {
      const resolved = resolveRelativeLink(currentRelative, href);
      const slug = relativePathToSlug(resolved);
      links.push({
        title,
        href: slug ? `/docs/${slug}` : '/docs',
        slug,
      });
    }
    match = pattern.exec(raw);
  }
  return links;
}

function parseFile(relativePath) {
  const sourcePath = path.join(docsRoot, relativePath);
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const titleLine = lines.find((l) => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : relativePath;

  let meta = null;
  let bodyStart = 0;
  let relatedDocuments = [];

  const tableStart = lines.findIndex((line, idx) => line.trim() === '| | |' && lines[idx + 1]?.trim().startsWith('|---'));
  if (tableStart !== -1) {
    const rows = {};
    let i = tableStart + 2;
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      const m = /^\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|$/.exec(lines[i].trim());
      if (m) rows[m[1].trim()] = m[2].trim();
      i += 1;
    }
    if (Object.keys(rows).length) {
      meta = {
        purpose: rows.Purpose ?? '',
        intendedAudience: rows['Intended Audience'] ?? '',
        lastUpdated: rows['Last Updated'] ?? '',
        relatedDocuments: rows['Related Documents'] ?? '',
      };
      relatedDocuments = parseRelatedDocuments(meta.relatedDocuments, relativePath);
      bodyStart = i;
      while (bodyStart < lines.length && lines[bodyStart].trim() !== '---') bodyStart += 1;
      if (lines[bodyStart]?.trim() === '---') bodyStart += 1;
    }
  }

  const body = lines.slice(bodyStart).join('\n');
  const headings = [];
  for (const line of body.split('\n')) {
    const m = /^(#{2,4})\s+(.+)$/.exec(line.trim());
    if (m) {
      const text = m[2].replace(/\*\*/g, '').trim();
      headings.push({ level: m[1].length, text, id: slugify(text) });
    }
  }

  return {
    title,
    sourcePath: path.join('docs', relativePath).replace(/\\/g, '/'),
    meta,
    headings,
    relatedDocuments,
    body,
  };
}

const pages = NAV_ITEMS.map((item) => {
  const parsed = parseFile(item.file);
  const searchText = [
    parsed.title,
    parsed.meta?.purpose ?? '',
    parsed.meta?.intendedAudience ?? '',
    parsed.headings.map((h) => h.text).join(' '),
    parsed.body.replace(/```[\s\S]*?```/g, ' '),
  ].join(' ').replace(/\s+/g, ' ').trim();

  return {
    title: parsed.title || item.title,
    slug: item.slug,
    sourcePath: parsed.sourcePath,
    headings: parsed.headings,
    relatedDocuments: parsed.relatedDocuments,
    lastUpdated: parsed.meta?.lastUpdated ?? '',
    searchText,
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  version: '1.0.0',
  pages,
};

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Generated docs manifest with ${pages.length} pages → frontend/.generated/docs-manifest.json`);
