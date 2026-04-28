const redis = require('../services/redis.service');
const { normalizePhone } = require('../utils/phone');

const MAX_PER_MINUTE = 3;
const MAX_PER_HOUR = 10;
const MINUTE_TTL_SECONDS = 60;
const HOUR_TTL_SECONDS = 3600;

function minuteBucketKey(normalizedPhone) {
  return `otp:rate:${normalizedPhone}:minute`;
}

function hourBucketKey(normalizedPhone) {
  return `otp:rate:${normalizedPhone}:hour`;
}

function rateLimitResponse(req, res) {
  return res.status(429).json({
    success: false,
    error: 'rate_limited',
    message: 'Too many OTP requests. Try later.',
    requestId: req.requestId,
  });
}

/**
 * Redis fixed-window limits per normalized phone: 3/min, 10/hour.
 * Skips counting when phone is missing or invalid (controller validates).
 */
async function rateLimitOtpSend(req, res, next) {
  const phone = req.body?.phone;
  if (phone === undefined || phone === null || typeof phone !== 'string') {
    next();
    return;
  }

  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(phone);
  } catch {
    next();
    return;
  }

  const minKey = minuteBucketKey(normalizedPhone);
  const hrKey = hourBucketKey(normalizedPhone);

  try {
    const client = await redis.getClient();

    const minuteCount = await client.incr(minKey);
    if (minuteCount === 1) {
      await client.expire(minKey, MINUTE_TTL_SECONDS);
    }

    if (minuteCount > MAX_PER_MINUTE) {
      await client.decr(minKey);
      rateLimitResponse(req, res);
      return;
    }

    const hourCount = await client.incr(hrKey);
    if (hourCount === 1) {
      await client.expire(hrKey, HOUR_TTL_SECONDS);
    }

    if (hourCount > MAX_PER_HOUR) {
      await client.decr(hrKey);
      await client.decr(minKey);
      rateLimitResponse(req, res);
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = rateLimitOtpSend;
