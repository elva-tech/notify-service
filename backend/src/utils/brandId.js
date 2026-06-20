/** Lowercase slug used in API requests and Redis OTP keys. */
const BRAND_ID_PATTERN = /^[a-z0-9_-]{2,20}$/;

/**
 * @param {unknown} brandId
 * @returns {string}
 */
function normalizeBrandId(brandId) {
  if (typeof brandId !== 'string') {
    throw new TypeError('brandId must be a string');
  }

  const normalized = brandId.trim().toLowerCase();
  if (!normalized) {
    throw new Error('brandId cannot be empty');
  }

  if (normalized.includes(':')) {
    throw new Error('brandId cannot contain ":"');
  }

  if (!BRAND_ID_PATTERN.test(normalized)) {
    throw new Error(
      'brandId must be 2–20 characters and contain only lowercase letters, digits, underscores, or hyphens',
    );
  }

  return normalized;
}

/**
 * @param {unknown} brandId
 * @returns {boolean}
 */
function isValidBrandId(brandId) {
  try {
    normalizeBrandId(brandId);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  BRAND_ID_PATTERN,
  normalizeBrandId,
  isValidBrandId,
};
