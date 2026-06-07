/**
 * Phase 9B verification — trigger intentional LOGIN_OTP DLT rejection against Fast2SMS.
 * Uses wrong sender_id with valid LOGIN_OTP templateId to capture provider message.
 *
 * Usage: node scripts/verify-fast2sms-dlt-rejection.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sendDltSMS } = require('../src/services/sms/providers/fast2sms');

const LOGIN_OTP_TEMPLATE_ID = '1207177979441360359';
const ENTITY_ID = process.env.FAST2SMS_ENTITY_ID || '1201177860312735154';
const TEST_PHONE = process.env.VERIFY_DLT_PHONE || '919876543210';

async function main() {
  console.log('Triggering intentional LOGIN_OTP DLT rejection (wrong sender_id)...\n');

  try {
    await sendDltSMS({
      phone: TEST_PHONE,
      senderId: 'INVALID',
      templateId: LOGIN_OTP_TEMPLATE_ID,
      variablesValues: '123456',
      entityId: ENTITY_ID,
      logContext: {
        business: 'enandi',
        templateKey: 'LOGIN_OTP',
        templateId: LOGIN_OTP_TEMPLATE_ID,
        requestId: 'verify-phase-9b',
      },
    });
    console.error('Unexpected success — provider should have rejected the request.');
    process.exit(1);
  } catch (err) {
    const failure = err?.providerFailure ?? {};
    console.log('--- Captured provider failure ---');
    console.log(JSON.stringify({
      message: err.message,
      providerMessage: err.providerMessage ?? failure.providerMessage,
      providerCode: err.providerCode ?? failure.providerCode,
      httpStatus: failure.httpStatus,
      providerResponse: failure.providerResponse ?? err.cause,
    }, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
