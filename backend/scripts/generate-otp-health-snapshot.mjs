/**
 * Standalone OTP health snapshot generator for CI and portal manifest builds.
 * Run from backend/: node scripts/generate-otp-health-snapshot.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const script = `
  require('./src/businesses');
  const { writeOtpHealthSnapshot, SNAPSHOT_PATH } = require('./src/services/otpHealthSnapshot.service');
  const snapshot = writeOtpHealthSnapshot('script');
  if (!snapshot) {
    console.error('Failed to write OTP health snapshot');
    process.exit(1);
  }
  console.log('Wrote OTP health snapshot → ' + SNAPSHOT_PATH);
`;

const result = spawnSync(process.execPath, ['-e', script], {
  cwd: backendRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    OTP_DLT_ENABLED: process.env.OTP_DLT_ENABLED ?? 'false',
  },
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
