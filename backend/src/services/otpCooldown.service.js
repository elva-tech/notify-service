const redis = require('./redis.service');
const { normalizePhone } = require('../utils/phone');
const { normalizeAppId } = require('../utils/appId');

const COOLDOWN_TTL_SECONDS = 30;

/**
 * Sets send cooldown after SMS succeeded (send + resend).
 * @param {string} phone
 * @param {string} appId
 */
async function applyAfterSuccessfulSend(phone, appId) {
  const key = redis.otpCooldownKey(normalizeAppId(appId), normalizePhone(phone));
  await redis.setKeyWithExpire(key, COOLDOWN_TTL_SECONDS);
}

module.exports = {
  applyAfterSuccessfulSend,
  COOLDOWN_TTL_SECONDS,
};
