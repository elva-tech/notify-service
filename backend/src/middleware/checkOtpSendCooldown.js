const redis = require('../services/redis.service');
const { normalizePhone } = require('../utils/phone');
const { normalizeBrandId } = require('../utils/brandId');

function cooldownActiveResponse(req, res) {
  return res.status(429).json({
    success: false,
    error: 'cooldown_active',
    message: 'Please wait before requesting another OTP',
    requestId: req.requestId,
  });
}

/**
 * Blocks /send and /resend when otp:cooldown:{brandId}:{phone} exists in Redis.
 * Runs after API key auth; skips when phone/brandId cannot be normalized (controller will 400).
 */
async function checkOtpSendCooldown(req, res, next) {
  const phone = req.body?.phone;
  const brandId = req.body?.brandId;

  if (typeof phone !== 'string' || typeof brandId !== 'string') {
    next();
    return;
  }

  let normalizedPhone;
  let normalizedBrandId;
  try {
    normalizedPhone = normalizePhone(phone);
    normalizedBrandId = normalizeBrandId(brandId);
  } catch {
    next();
    return;
  }

  try {
    const key = redis.otpCooldownKey(normalizedBrandId, normalizedPhone);
    const active = await redis.existsKey(key);
    if (active) {
      cooldownActiveResponse(req, res);
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkOtpSendCooldown;
