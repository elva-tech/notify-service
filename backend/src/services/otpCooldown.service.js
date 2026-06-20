const redis = require('./redis.service');
const { normalizePhone } = require('../utils/phone');
const { normalizeBrandId } = require('../utils/brandId');

const COOLDOWN_TTL_SECONDS = 30;

/**
 * Sets send cooldown after SMS succeeded (send + resend).
 * @param {string} phone
 * @param {string} brandId
 */
async function applyAfterSuccessfulSend(phone, brandId) {
  const key = redis.otpCooldownKey(normalizeBrandId(brandId), normalizePhone(phone));
  await redis.setKeyWithExpire(key, COOLDOWN_TTL_SECONDS);
}

module.exports = {
  applyAfterSuccessfulSend,
  COOLDOWN_TTL_SECONDS,
};
