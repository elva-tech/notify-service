const redis = require('../services/redis.service');
const { normalizePhone } = require('../utils/phone');
const { normalizeAppId } = require('../utils/appId');

function cooldownActiveResponse(res) {
  return res.status(429).json({
    success: false,
    error: 'cooldown_active',
    message: 'Please wait before requesting another OTP',
  });
}

/**
 * Blocks /send and /resend when otp:cooldown:{appId}:{phone} exists in Redis.
 * Runs after API key auth; skips when phone/appId cannot be normalized (controller will 400).
 */
async function checkOtpSendCooldown(req, res, next) {
  const phone = req.body?.phone;
  const appId = req.body?.appId;

  if (typeof phone !== 'string' || typeof appId !== 'string') {
    next();
    return;
  }

  let normalizedPhone;
  let normalizedAppId;
  try {
    normalizedPhone = normalizePhone(phone);
    normalizedAppId = normalizeAppId(appId);
  } catch {
    next();
    return;
  }

  try {
    const key = redis.otpCooldownKey(normalizedAppId, normalizedPhone);
    const active = await redis.existsKey(key);
    if (active) {
      cooldownActiveResponse(res);
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkOtpSendCooldown;
