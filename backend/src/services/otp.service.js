const { normalizePhone } = require('../utils/phone');
const { normalizeBrandId } = require('../utils/brandId');
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

function logVerifyOutcome(logContext, brandId, outcome, reason = null) {
  const details = {
    brandId: brandId ?? null,
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
 * @param {string} brandId
 * @returns {Promise<{ otp: string, expiresAt: number, expiresInSeconds: number }>}
 */
async function generateOTP(recipient, brandId, logContext = {}) {
  const recipientKey = normalizeRecipient(recipient);
  const brandKey = normalizeBrandId(brandId);
  const channel = recipientKey.includes('@') ? 'EMAIL' : 'SMS';
  const otp = generateSixDigitOtp();
  const salt = randomSalt();
  const hashBuf = hashOtp(otp, salt);
  const key = redis.otpKey(brandKey, recipientKey);

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
    { brandId: brandKey },
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
 * @param {string} brandId
 * @returns {Promise<{ valid: true } | { valid: false, reason: string }>}
 */
async function verifyOTP(recipient, otp, brandId, logContext = {}) {
  if (typeof otp !== 'string') {
    logVerifyOutcome(buildLogContext(logContext), null, 'rejected', 'invalid_input');
    return { valid: false, reason: 'invalid_input' };
  }

  if (typeof brandId !== 'string') {
    logVerifyOutcome(buildLogContext(logContext), null, 'rejected', 'invalid_input');
    return { valid: false, reason: 'invalid_input' };
  }

  let recipientKey;
  try {
    recipientKey = normalizeRecipient(recipient);
  } catch {
    logVerifyOutcome(buildLogContext(logContext), brandId, 'rejected', 'invalid_contact');
    return { valid: false, reason: 'invalid_contact' };
  }

  let brandKey;
  try {
    brandKey = normalizeBrandId(brandId);
  } catch {
    logVerifyOutcome(buildLogContext({
      ...logContext,
      recipient: recipientKey,
    }), brandId, 'rejected', 'invalid_brand_id');
    return { valid: false, reason: 'invalid_brand_id' };
  }

  const code = otp.trim();
  if (!/^\d{6}$/.test(code)) {
    logVerifyOutcome(buildLogContext({
      ...logContext,
      recipient: recipientKey,
      channel: recipientKey.includes('@') ? 'EMAIL' : 'SMS',
    }), brandKey, 'rejected', 'invalid_otp_format');
    return { valid: false, reason: 'invalid_otp_format' };
  }

  const key = redis.otpKey(brandKey, recipientKey);
  const record = await redis.getHashAll(key);

  const otpLogContext = buildLogContext({
    ...logContext,
    recipient: recipientKey,
    channel: recipientKey.includes('@') ? 'EMAIL' : 'SMS',
  });

  if (!isCompleteOtpRecord(record)) {
    logVerifyOutcome(otpLogContext, brandKey, 'rejected', 'not_found');
    return { valid: false, reason: 'not_found' };
  }

  const attempts = parseInt(record[ATTEMPTS_FIELD], 10);
  if (Number.isNaN(attempts)) {
    logVerifyOutcome(otpLogContext, brandKey, 'rejected', 'not_found');
    return { valid: false, reason: 'not_found' };
  }

  if (attempts >= MAX_ATTEMPTS) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, brandKey, 'rejected', 'max_attempts');
    logOtp('otp_verify_failed', 'rejected', otpLogContext, {
      brandId: brandKey,
      reason: 'max_attempts',
    });
    return { valid: false, reason: 'max_attempts' };
  }

  const storedHash = Buffer.from(record[HASH_FIELD], 'hex');
  const salt = Buffer.from(record[SALT_FIELD], 'hex');
  const candidate = hashOtp(code, salt);

  if (digestsEqual(candidate, storedHash)) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, brandKey, 'success');
    logOtp('otp_verified', 'completed', otpLogContext, { brandId: brandKey });
    return { valid: true };
  }

  const nextAttempts = await redis.hashIncrementBy(key, ATTEMPTS_FIELD, 1);
  if (nextAttempts >= MAX_ATTEMPTS) {
    await redis.deleteKey(key);
    logVerifyOutcome(otpLogContext, brandKey, 'rejected', 'max_attempts');
    logOtp('otp_verify_failed', 'rejected', otpLogContext, {
      brandId: brandKey,
      reason: 'max_attempts',
    });
    return { valid: false, reason: 'max_attempts' };
  }

  logVerifyOutcome(otpLogContext, brandKey, 'rejected', 'mismatch');
  logOtp('otp_verify_failed', 'rejected', otpLogContext, {
    brandId: brandKey,
    reason: 'mismatch',
  });
  return { valid: false, reason: 'mismatch' };
}

/**
 * Removes any stored OTP for the recipient and brand (e.g. after a failed SMS send).
 * @param {string} recipient
 * @param {string} brandId
 */
async function revokeOTP(recipient, brandId) {
  const recipientKey = normalizeRecipient(recipient);
  const brandKey = normalizeBrandId(brandId);
  await redis.deleteKey(redis.otpKey(brandKey, recipientKey));
}

module.exports = {
  generateOTP,
  verifyOTP,
  revokeOTP,
};
