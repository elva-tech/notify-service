/**
 * Verifies OTP DLT routing decision logic (no provider calls).
 * Run from backend/: node scripts/verify-otp-dlt-routing.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

function runNode(script, env = {}) {
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: backendRoot,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return (result.stdout || '').trim();
}

const scenarios = [
  {
    name: 'OTP_DLT_ENABLED=false → legacy_q',
    env: { OTP_DLT_ENABLED: 'false' },
    script: `
      require('./src/businesses');
      const { getOtpDeliveryPolicy } = require('./src/services/otpDltResolver.service');
      const p = getOtpDeliveryPolicy('eNandi');
      process.stdout.write('POLICY=' + p.deliveryPolicy);
    `,
    expect: 'POLICY=legacy_q',
  },
  {
    name: 'OTP_DLT_ENABLED=true + dltEnabled=true + legacyRouteEnabled=true (CMS) → hybrid',
    env: { OTP_DLT_ENABLED: 'true' },
    script: `
      require('./src/businesses');
      const { getOtpDeliveryPolicy } = require('./src/services/otpDltResolver.service');
      const p = getOtpDeliveryPolicy('CMS');
      process.stdout.write('POLICY=' + p.deliveryPolicy + ',FALLBACK=' + p.fallbackAllowed);
    `,
    expect: 'POLICY=hybrid,FALLBACK=true',
  },
  {
    name: 'OTP_DLT_ENABLED=true + dltEnabled=true + legacyRouteEnabled=false (eNandi) → dlt_only',
    env: { OTP_DLT_ENABLED: 'true' },
    script: `
      require('./src/businesses');
      const { getOtpDeliveryPolicy, isDltOnly } = require('./src/services/otpDltResolver.service');
      const p = getOtpDeliveryPolicy('eNandi');
      process.stdout.write('POLICY=' + p.deliveryPolicy + ',DLT_ONLY=' + isDltOnly('eNandi'));
    `,
    expect: 'POLICY=dlt_only,DLT_ONLY=true',
  },
  {
    name: 'eNandi legacyRouteEnabled=false → fallback not allowed',
    env: { OTP_DLT_ENABLED: 'true' },
    script: `
      require('./src/businesses');
      const { isLegacyFallbackAllowed } = require('./src/services/otpDltResolver.service');
      process.stdout.write('FALLBACK=' + isLegacyFallbackAllowed('eNandi'));
    `,
    expect: 'FALLBACK=false',
  },
];

function extractResult(output, prefix) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].startsWith(prefix)) {
      return lines[i];
    }
  }
  return output.trim();
}

let passed = 0;
for (const scenario of scenarios) {
  const output = runNode(scenario.script, scenario.env);
  const actual = extractResult(output, scenario.expect.split('=')[0] + '=');
  const ok = actual === scenario.expect;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${scenario.name} → ${actual}`);
  if (!ok) {
    console.log(`  expected: ${scenario.expect}`);
  }
  if (ok) passed += 1;
}

console.log(`\n${passed}/${scenarios.length} routing scenarios passed`);
process.exit(passed === scenarios.length ? 0 : 1);
