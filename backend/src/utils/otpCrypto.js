const crypto = require('crypto');

const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function generateSixDigitOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

function randomSalt() {
  return crypto.randomBytes(SALT_BYTES);
}

function hashOtp(plainOtp, salt) {
  return crypto.scryptSync(plainOtp, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
}

function digestsEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  generateSixDigitOtp,
  randomSalt,
  hashOtp,
  digestsEqual,
};
