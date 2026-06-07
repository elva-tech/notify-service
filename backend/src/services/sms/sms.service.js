const { normalizePhone } = require('../../utils/phone');
const fast2sms = require('./providers/fast2sms');

function buildOtpMessage(otp, _appId) {
  return `Your ELVA OTP is ${otp}. It expires in 5 minutes.`;
}

/**
 * Sends OTP via the configured SMS provider.
 * Replace or extend the provider import when adding MSG91, Gupshup, etc.
 *
 * @param {string} phone
 * @param {string} otp
 * @param {string} appId Application id (for future per-app templates or provider metadata).
 * @param {object} [logContext]
 * @returns {Promise<unknown>}
 */
async function sendOTP(phone, otp, appId, logContext = {}) {
  const normalized = normalizePhone(phone);
  const message = buildOtpMessage(otp, appId);
  return fast2sms.sendSMS(normalized, message, logContext);
}

async function sendMessage(phone, message, logContext = {}) {
  const normalized = normalizePhone(phone);
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('SMS message is required');
  }
  return fast2sms.sendSMS(normalized, message.trim(), logContext);
}

/**
 * Sends a DLT-templated SMS using a resolver-built payload.
 *
 * @param {string} phone
 * @param {{
 *   senderId: string,
 *   templateId: string,
 *   messageId: string,
 *   entityId: string,
 *   variablesValues: string
 * }} dltPayload
 * @param {object} [logContext]
 * @returns {Promise<unknown>}
 */
async function sendDltTemplated(phone, dltPayload, logContext = {}) {
  const normalized = normalizePhone(phone);
  return fast2sms.sendDltSMS({
    phone: normalized,
    senderId: dltPayload.senderId,
    templateId: dltPayload.templateId,
    messageId: dltPayload.messageId,
    variablesValues: dltPayload.variablesValues,
    entityId: dltPayload.entityId,
    logContext: {
      ...logContext,
      templateId: dltPayload.templateId,
      messageId: dltPayload.messageId,
      provider: 'fast2sms',
    },
  });
}

module.exports = {
  sendOTP,
  sendMessage,
  sendDltTemplated,
};
