const config = require('../../../config/env');

const BULK_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * @param {string} phone Digits-only number string (provider-specific formatting).
 * @param {string} message
 * @returns {Promise<unknown>} Parsed JSON body from Fast2SMS.
 */
async function sendSMS(phone, message) {
  const apiKey = config.fast2sms.apiKey?.trim();
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY is not set');
  }

  const response = await fetch(BULK_API_URL, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      numbers: phone,
    }),
  });

  const text = await response.text();
  console.log("FAST2SMS RAW RESPONSE:", text);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  console.log("FAST2SMS PARSED:", body);

  if (!response.ok) {
    const err = new Error(`Fast2SMS request failed: HTTP ${response.status}`);
    err.cause = body;
    throw err;
  }

  return body;
}

module.exports = { sendSMS };
