/**
 * Validate all business configurations with PASS / WARN / FAIL diagnostics.
 * Usage: node backend/scripts/validate-business-configs.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const script = `
  require('./src/businesses/configLoader');
  const {
    validateAllBusinessConfigs,
    writeBusinessHealthSnapshot,
    SNAPSHOT_PATH,
  } = require('./src/services/businessConfigAudit.service');
  const result = validateAllBusinessConfigs();
  writeBusinessHealthSnapshot('cli');
  console.log('STATUS=' + result.status);
  for (const diagnostic of result.diagnostics) {
    const prefix = diagnostic.businessId ? '[' + diagnostic.businessId + '] ' : '';
    console.log(diagnostic.level + ': ' + prefix + diagnostic.message);
  }
  console.log('SNAPSHOT=' + SNAPSHOT_PATH);
  process.exit(result.status === 'FAIL' ? 1 : 0);
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

process.exit(result.status ?? 1);
