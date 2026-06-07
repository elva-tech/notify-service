/**
 * Phase 8C verification — logging and snapshot (no provider calls).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const snapshotPath = path.join(backendRoot, '.generated', 'otp-health-snapshot.json');

function runNode(script, env = {}) {
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: backendRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

const checks = [];

// 1. Snapshot exists
checks.push({
  name: 'Health snapshot file exists',
  ok: fs.existsSync(snapshotPath),
});

if (fs.existsSync(snapshotPath)) {
  const snap = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  checks.push({ name: 'Snapshot has configHealth', ok: snap.configHealth?.status === 'healthy' });
  checks.push({ name: 'Snapshot has retirementReadiness', ok: Boolean(snap.retirementReadiness) });
}

// 2. otp_verify_outcome logging
const verifyTest = runNode(`
  const logs = [];
  const orig = console.log;
  console.log = (line) => { try { logs.push(JSON.parse(line)); } catch {} };
  require('./src/businesses');
  const { verifyOTP } = require('./src/services/otp.service');
  (async () => {
    await verifyOTP('919999999999', 'abc', 'eNandi', { requestId: 'test-8c' });
    const outcomes = logs.filter(l => l.event === 'otp_verify_outcome');
    process.stdout.write('COUNT=' + outcomes.length + ' REASON=' + (outcomes[0]?.reason ?? 'none'));
  })();
`, { OTP_DLT_ENABLED: 'false' });

const verifyMatch = verifyTest.stdout.match(/COUNT=(\d+) REASON=(\w+)/);
checks.push({
  name: 'otp_verify_outcome emitted',
  ok: verifyMatch && Number(verifyMatch[1]) >= 1,
});

// 3. isOtpDltEnabled fallback
const fallbackTest = runNode(`
  require('./src/businesses');
  const { isOtpDltEnabled } = require('./src/services/otpDltResolver.service');
  process.stdout.write(isOtpDltEnabled('eNandi') ? 'dlt' : 'legacy_q');
`, { OTP_DLT_ENABLED: 'false' });
checks.push({
  name: 'OTP_DLT_ENABLED=false → legacy routing',
  ok: fallbackTest.stdout.trim() === 'legacy_q',
});

const dltTest = runNode(`
  require('./src/businesses');
  const { isOtpDltEnabled } = require('./src/services/otpDltResolver.service');
  process.stdout.write(isOtpDltEnabled('eNandi') ? 'dlt' : 'legacy_q');
`, { OTP_DLT_ENABLED: 'true' });
checks.push({
  name: 'OTP_DLT_ENABLED=true + dltEnabled → dlt routing',
  ok: dltTest.stdout.trim() === 'dlt',
});

let passed = 0;
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}: ${check.name}`);
  if (check.ok) passed += 1;
}
console.log(`\n${passed}/${checks.length} Phase 8C backend checks passed`);
process.exit(passed === checks.length ? 0 : 1);
