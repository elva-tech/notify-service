const { normalizePhone } = require('../utils/phone');
const { normalizeAppId } = require('../utils/appId');
const { normalizeEmail } = require('../utils/email');
const {
  generateSixDigitOtp,
  randomSalt,
  hashOtp,
  digestsEqual,
} = require('../utils/otpCrypto');
const redis = require('./redis.service');
const { logOtp } = require('./logging/businessLogger.service');
const { buildLogContext } = require('./logging/logContext');

const OTP_TTL_SECONDS = 5 * 60;
const OTP_TTL_MS = OTP_TTL_SECONDS * 1000;
const MAX_ATTEMPTS = 3;

const HASH_FIELD = 'hash';
const SALT_FIELD = 'salt';
const ATTEMPTS_FIELD = 'attempts';

function isCompleteOtpRecord(record) {
  return (
    typeof record[HASH_FIELD] === 'string'
    && typeof record[SALT_FIELD] === 'string'
    && typeof record[ATTEMPTS_FIELD] === 'string'
  );
}

function logVerifyOutcome(logContext, appId, outcome, reason = null) {
  const details = {
    appId: appId ?? null,
    outcome,
    ...(reason ? { reason } : {}),
  };
  logOtp(
    'otp_verify_outcome',
    outcome === 'success' ? 'completed' : 'rejected',
    logContext,
    details,
  );
}

/**
 * @param {string} recipient
 * @returns {string}
 */
function normalizeRecipient(recipient) {
  if (typeof recipient !== 'string') {
    throw new TypeError('recipient must be a string');
  }

  const trimmed = recipient.trim();
  if (trimmed.includes('@')) {
    return normalizeEmail(trimmed);
  }

  return normalizePhone(trimmed);
}

/**
 * @param {string} recipient
 * @param {string} appId
 * @returns {Promise<{ otp: string, expiresAt: number, expiresInSeconds: number }>}
 */
async function generateOTP(recipient, appId, logContext = {}) {
  const recipientKey = normalizeRecipient(recipient);
  const appKey = normalizeAppId(appId);
  const channel = recipientKey.includes('@') ? 'EMAIL' : 'SMS';
  const otp = generateSixDigitOtp();
  const salt = randomSalt();
  const hashBuf = hashOtp(otp, salt);
  const key = redis.otpKey(appKey, recipientKey);

  await redis.setHashWithExpire(
    key,
    {
      [HASH_FIELD]: hashBuf.toString('hex'),
      [SALT_FIELD]: salt.toString('hex'),
      [ATTEMPTS_FIELD]: '0',
    },
    OTP_TTL_SECONDS,
  );

  logOtp(
    'otp_generated',
    'completed',
    buildLogContext({
      ...logContext,
      recipient: recipientKey,
      channel,
    }),
    { appId: appKey },
  );

  return {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    expiresInSeconds: OTP_TTL_SECONDS,
  };
}

/**
 * @param {string} recipient
 * @param {string} otp
 * @param {string} appId
 * @returns {Promise<{ valid: true } | { valid: false, reason: string }>}
 */
async function verifyOTP(recipient, otp, appId, logContext = {}) {
  if (typeof otp !== 'string') {
    logVerifyOutcome(buildLogContext(logContext), null, 'rejected', 'invalid_input');
    return { valid: false, reason: 'invalid_input' };
  }

  if (typeof appId !== 'string') {
    logVerifyOutcome(buildLogContext(logContext), null, 'rejected', 'invalid_input');
    return { valid: false, reason: 'invalid_input' };
  }

  let recipientKey;
  try {
    recipientKey = normalizeRecipient(recipient);
  } catch {
    logVerifyOutcome(buildLogContext(logContext), appId, 'rejected', 'invalid_contact');
    return { valid: false, reason: 'invalid_contact' };
  }

  let appKey;
  try {
    appKey = normalizeAppId(appId);
  } catch {
    logVerifyOutcome(buildLogContext({
      ...logContext,
      recipient: recipientKey,
    }), appId, 'rejected', 'invalid_app_id');
    return { valid: false, reason: 'invalid_app_id' };
  }

  const code = otp.trim();
  if (!/^\d{6}$/.test(code)) {
    logVerifyOutcome(buildLogContext({
      ...logContext,
      recipient: recipientKey,
      channel: recipientKey.includes('@') ? 'EMAIL' : 'SMS',
    }), appKey, 'rejected', 'invalid_otp_format');
    return { valid: false, reason: 'invalid_otp_format' };
  }

  const key = redis.otpKey(appKey, recipientKey);
  const record = await redis.getHashAll(key);

  const otpLogContext = buildLogContext({
    ...logContext,
    recipient: recipientKey,
    channel: recipientKey.includes('@') ? 'EMAIL' : 'SMS',
  });

  if (!isCompleteOtpRecord(record)) {
    logVerifyOutcome(otpLogContext, appKey, 'rejected', 'not_found');
    return { valid: false, reason: 'not_found' };
  }

  const attempts = parseInt(record[ATTEMPTS_FIELD], 10);
  if (Number.isNaN(attempts)) {
    logVerifyOutcome(otpLogContext, appKey, 'rejected', 'not_found');
    return { valid: false, reason: 'not_found' };
  }

  if (attempts >= MAX_ATTEMPTS) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, appKey, 'rejected', 'max_attempts');
    logOtp('otp_verify_failed', 'rejected', otpLogContext, {
      appId: appKey,
      reason: 'max_attempts',
    });
    return { valid: false, reason: 'max_attempts' };
  }

  const storedHash = Buffer.from(record[HASH_FIELD], 'hex');
  const salt = Buffer.from(record[SALT_FIELD], 'hex');
  const candidate = hashOtp(code, salt);

  if (digestsEqual(candidate, storedHash)) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, appKey, 'success');
    logOtp('otp_verified', 'completed', otpLogContext, { appId: appKey });
    return { valid: true };
  }

  const nextAttempts = await redis.hashIncrementBy(key, ATTEMPTS_FIELD, 1);
  if (nextAttempts >= MAX_ATTEMPTS) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, appKey, 'rejected', 'max_attempts');
    logOtp('otp_verify_failed', 'rejected', otpLogContext, {
      appId: appKey,
      reason: 'max_attempts',
    });
    return { valid: false, reason: 'max_attempts' };
  }

  logVerifyOutcome(otpLogContext, appKey, 'rejected', 'mismatch');
  logOtp('otp_verify_failed', 'rejected', otpLogContext, {
    appId: appKey,
    reason: 'mismatch',
  });
  return { valid: false, reason: 'mismatch' };
}

/**
 * Removes any stored OTP for the phone and app (e.g. after a failed SMS send).
 * @param {string} recipient
 * @param {string} appId
 */
async function revokeOTP(recipient, appId) {
  const recipientKey = normalizeRecipient(recipient);
  const appKey = normalizeAppId(appId);
  await redis.deleteKey(redis.otpKey(appKey, recipientKey));
}

module.exports = {
  generateOTP,
  verifyOTP,
  revokeOTP,
};
