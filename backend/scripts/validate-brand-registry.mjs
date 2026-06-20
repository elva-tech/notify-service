/**
 * Validate brand-registry.json with PASS / FAIL diagnostics.
 * Usage: node backend/scripts/validate-brand-registry.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const script = `
  const { loadBusinessConfigurations } = require('./src/businesses/configLoader');
  loadBusinessConfigurations();
  const {
    loadBrandRegistryFile,
    validateBrandRegistryDocument,
    BRAND_REGISTRY_PATH,
    listActiveBrands,
  } = require('./src/services/brandRegistry.service');

  const document = loadBrandRegistryFile();
  const summary = validateBrandRegistryDocument(document);
  const activeBrands = listActiveBrands();

  console.log('STATUS=PASS');
  console.log('REGISTRY=' + BRAND_REGISTRY_PATH);
  console.log('version=' + summary.version);
  console.log('brandCount=' + summary.brandCount);
  console.log('activeCount=' + summary.activeCount);

  for (const brand of activeBrands) {
    console.log(
      'ACTIVE: ' +
        brand.brandId +
        ' brandName=' +
        brand.brandName +
        ' otp=' +
        brand.templates.otp.join(',') +
        ' notify=' +
        brand.templates.notify.join(',')
    );
  }

  process.exit(0);
`;

const result = spawnSync(process.execPath, ['-e', script], {
  cwd: backendRoot,
  encoding: 'utf8',
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  if (!result.stdout?.includes('STATUS=')) {
    console.error('STATUS=FAIL');
  }
}

process.exit(result.status ?? 1);
