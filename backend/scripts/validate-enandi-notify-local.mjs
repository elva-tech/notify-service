/**
 * Phase 8E — Local validation for all eNandi DLT templates (no SMS sends).
 * Run from repo root: node backend/scripts/validate-enandi-notify-local.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const script = `
require('./src/businesses');
const { validateTemplateRequest } = require('./src/services/templateValidation/templateValidation.service');
const { buildDltPayload } = require('./src/services/dltPayloadResolver.service');
const { TemplateValidationError } = require('./src/services/templateValidation/errors');

const CASES = [
  { key: 'LOGIN_OTP', otp: true, valid: { businessName: 'eNandi', otp: '482910' }, invalid: { businessName: 'eNandi', otp: '12' }, invalidExpect: 'validation_error' },
  { key: 'LOGIN_OTP_WITH_ID', otp: true, valid: { businessName: 'eNandi', loginId: '7488', otp: '482910' }, invalid: { businessName: 'eNandi', otp: '482910' }, invalidExpect: 'missing_variable' },
  { key: 'ORDER_PLACED', otp: false, valid: { customerName: 'Arun', businessName: 'eNandi', orderId: 'ORD-2026-001' }, invalid: { customerName: 'Arun', businessName: 'eNandi' }, invalidExpect: 'missing_variable' },
  { key: 'ORDER_DELIVERED', otp: false, valid: { customerName: 'Arun', orderId: 'ORD-2026-001', businessName: 'eNandi' }, invalid: { customerName: 'Arun', orderId: 'ORD-2026-001' }, invalidExpect: 'missing_variable' },
  { key: 'OUT_FOR_DELIVERY', otp: false, valid: { customerName: 'Arun', orderId: 'ORD-2026-001', businessName: 'eNandi' }, invalid: { customerName: 'Arun', orderId: 'ORD-2026-001' }, invalidExpect: 'missing_variable' },
];

function validateNotify(templateKey, variables, rejectOtp) {
  try {
    const validated = validateTemplateRequest({
      mode: 'template',
      business: 'enandi',
      templateKey,
      variables,
      rejectOtpTemplates: rejectOtp,
    });
    const payload = buildDltPayload(validated);
    return { ok: true, code: 'ok', payload };
  } catch (err) {
    return {
      ok: false,
      code: err instanceof TemplateValidationError ? err.code : 'error',
      message: err.message,
      payload: null,
    };
  }
}

const rows = [];
for (const c of CASES) {
  const dltPayload = validateNotify(c.key, c.valid, false);
  const notifyValid = validateNotify(c.key, c.valid, true);
  const notifyInvalid = validateNotify(c.key, c.invalid, true);

  rows.push({
    templateKey: c.key,
    dltPayloadReady: dltPayload.ok,
    dltPayload: dltPayload.payload
      ? {
          senderId: dltPayload.payload.senderId,
          templateId: dltPayload.payload.templateId,
          entityId: dltPayload.payload.entityId,
          variablesValues: dltPayload.payload.variablesValues,
        }
      : null,
    notifyValid: {
      expected: c.otp ? 'otp_template_not_supported' : 'ok',
      code: notifyValid.code,
      pass: c.otp ? notifyValid.code === 'otp_template_not_supported' : notifyValid.ok,
    },
    notifyInvalid: {
      expected: c.invalidExpect,
      code: notifyInvalid.code,
      pass: notifyInvalid.code === c.invalidExpect || (c.otp && notifyInvalid.code === 'otp_template_not_supported'),
    },
  });
}

console.log(JSON.stringify(rows, null, 2));
const failed = rows.filter((r) => !r.dltPayloadReady || !r.notifyValid.pass || !r.notifyInvalid.pass);
process.exit(failed.length ? 1 : 0);
`;

const result = spawnSync(process.execPath, ['-e', script], {
  cwd: backendRoot,
  encoding: 'utf8',
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
