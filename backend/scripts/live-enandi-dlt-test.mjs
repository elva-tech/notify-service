/**
 * Phase 8E — Live Fast2SMS DLT tests for all eNandi templates.
 * Run from repo root: node backend/scripts/live-enandi-dlt-test.mjs [--phone=919876543210] [--dry-run]
 *
 * Prerequisites: backend/.env or root .env with FAST2SMS_API_KEY, Redis for OTP tests.
 * Set LIVE_DLT_PHONE env or --phone= for handset tests.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const reportPath = path.join(backendRoot, '..', 'docs', 'reports', 'ELVA_NOTIFY_PHASE_8E_LIVE_RESULTS.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const phoneArg = args.find((a) => a.startsWith('--phone='));
const phone = phoneArg?.split('=')[1] ?? process.env.LIVE_DLT_PHONE ?? '';

const NOTIFY_ORDER = ['ORDER_PLACED', 'ORDER_DELIVERED', 'OUT_FOR_DELIVERY'];
const OTP_ORDER = ['LOGIN_OTP', 'LOGIN_OTP_WITH_ID'];

const script = `
require('./src/businesses');
const { validateTemplateRequest } = require('./src/services/templateValidation/templateValidation.service');
const { buildDltPayload } = require('./src/services/dltPayloadResolver.service');
const fast2sms = require('./src/services/sms/providers/fast2sms');

const phone = ${JSON.stringify(phone)};
const dryRun = ${dryRun};
const notifyOrder = ${JSON.stringify(NOTIFY_ORDER)};
const otpOrder = ${JSON.stringify(OTP_ORDER)};

const SAMPLES = {
  ORDER_PLACED: { customerName: 'Arun', businessName: 'eNandi', orderId: 'ORD-8E-001' },
  ORDER_DELIVERED: { customerName: 'Arun', orderId: 'ORD-8E-001', businessName: 'eNandi' },
  OUT_FOR_DELIVERY: { customerName: 'Arun', orderId: 'ORD-8E-001', businessName: 'eNandi' },
  LOGIN_OTP: { businessName: 'eNandi', otp: '482910' },
  LOGIN_OTP_WITH_ID: { businessName: 'eNandi', loginId: '7488', otp: '482910' },
};

async function sendTemplate(templateKey, variables) {
  const validated = validateTemplateRequest({
    mode: 'template',
    business: 'enandi',
    templateKey,
    variables,
    rejectOtpTemplates: false,
  });
  const dltPayload = buildDltPayload(validated);
  const record = {
    templateKey,
    variables,
    dltPayload,
    fast2smsRequest: {
      route: 'dlt',
      sender_id: dltPayload.senderId,
      message: dltPayload.templateId,
      variables_values: dltPayload.variablesValues,
      entity_id: dltPayload.entityId,
      numbers: phone,
    },
    providerResponse: null,
    ok: false,
    error: null,
  };

  if (dryRun || !phone) {
    record.ok = true;
    record.skipped = 'dry-run or no phone';
    return record;
  }

  try {
    const body = await fast2sms.sendDltSMS({
      phone,
      senderId: dltPayload.senderId,
      templateId: dltPayload.templateId,
      variablesValues: dltPayload.variablesValues,
      entityId: dltPayload.entityId,
      logContext: { business: 'enandi', templateKey },
    });
    record.providerResponse = body;
    record.ok = body?.return === true || body?.return === undefined;
    if (body?.return === false) {
      record.error = body?.message ?? 'Fast2SMS return:false';
      record.ok = false;
    }
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
    record.providerResponse = err?.cause ?? null;
    record.ok = false;
  }
  return record;
}

async function postJson(path, payload) {
  const base = process.env.LIVE_API_BASE ?? 'http://localhost:4000';
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { status: res.status, body, ok: res.ok };
}

async function runOtpTest(appId, apiKey, loginId) {
  const sendPayload = { appId, apiKey, phone };
  if (loginId) sendPayload.loginId = loginId;
  const send = await postJson('/otp/send', sendPayload);
  return { sendPayload, send, verify: null };
}

(async () => {
  const results = { notify: [], otp: [], startedAt: new Date().toISOString(), phone, dryRun };

  for (const templateKey of notifyOrder) {
    const row = await sendTemplate(templateKey, SAMPLES[templateKey]);
    results.notify.push(row);
    if (!row.ok && !dryRun && phone) {
      console.error('STOP: notify template failed:', templateKey);
      console.log(JSON.stringify(results, null, 2));
      process.exit(1);
    }
  }

  for (const templateKey of otpOrder) {
    if (templateKey === 'LOGIN_OTP') {
      const row = await runOtpTest('CMS', process.env.CMS_API_KEY ?? 'CMS_456');
      results.otp.push({ templateKey, ...row });
    } else {
      const row = await sendTemplate(templateKey, SAMPLES[templateKey]);
      results.otp.push({ templateKey, directDlt: row });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  require('fs').writeFileSync(${JSON.stringify(reportPath)}, JSON.stringify(results, null, 2));
})();
`;

const result = spawnSync(process.execPath, ['-e', script], {
  cwd: backendRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    OTP_DLT_ENABLED: 'true',
    NODE_OPTIONS: '--no-warnings',
  },
  timeout: 120000,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
  try {
    const json = JSON.parse(result.stdout.trim().split('\n').pop() || result.stdout);
    fs.writeFileSync(reportPath, JSON.stringify(json, null, 2));
  } catch {
    // partial output
  }
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
