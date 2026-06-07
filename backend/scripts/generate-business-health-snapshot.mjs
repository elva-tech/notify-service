/**
 * Standalone business health snapshot generator for CI and portal manifest builds.
 * Run: node backend/scripts/generate-business-health-snapshot.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const script = `
  require('./src/businesses/configLoader');
  const { writeBusinessHealthSnapshot, SNAPSHOT_PATH } = require('./src/services/businessConfigAudit.service');
  const snapshot = writeBusinessHealthSnapshot('script');
  if (!snapshot) {
    console.error('Failed to write business health snapshot');
    process.exit(1);
  }
  console.log('Wrote business health snapshot → ' + SNAPSHOT_PATH);
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
