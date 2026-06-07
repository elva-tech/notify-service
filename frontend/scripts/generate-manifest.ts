import { buildManifest, writeManifest } from '../lib/manifest';

const manifest = buildManifest();
writeManifest(manifest);

console.log(`Generated docs manifest with ${manifest.pages.length} pages → frontend/.generated/docs-manifest.json`);
