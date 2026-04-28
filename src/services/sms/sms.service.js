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
 * @returns {Promise<unknown>}
 */
async function sendOTP(phone, otp, appId) {
  const normalized = normalizePhone(phone);
  const message = buildOtpMessage(otp, appId);
  return fast2sms.sendSMS(normalized, message);
}

async function sendMessage(phone, message) {
  const normalized = normalizePhone(phone);
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('SMS message is required');
  }
  return fast2sms.sendSMS(normalized, message.trim());
}

module.exports = {
  sendOTP,
  sendMessage,
};
