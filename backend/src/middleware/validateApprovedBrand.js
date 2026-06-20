/**
 * Phase 3 — approved-brand gate for OTP and notify (runs after API key auth).
 */

const { normalizeBrandId } = require('../utils/brandId');
const { getBrand, resolveBrandFromNotifyBody } = require('../services/brandRegistry.service');
const { classifyNotifySmsMode } = require('../services/templateValidation/notifyMode');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function brandGateError(req, res, status, error, message) {
  return res.status(status).json({
    success: false,
    error,
    message,
    requestId: req.requestId,
  });
}

/**
 * @param {object | null} brand
 * @returns {{ ok: true, brand: object } | { ok: false, status: number, error: string, message: string }}
 */
function assertBrandIsActive(brand) {
  if (!brand) {
    return {
      ok: false,
      status: 403,
      error: 'brand_not_approved',
      message: 'Brand is not registered or not approved for API access',
    };
  }

  if (brand.status === 'suspended') {
    return {
      ok: false,
      status: 403,
      error: 'brand_suspended',
      message: `Brand "${brand.brandId}" is suspended`,
    };
  }

  if (brand.status !== 'active') {
    return {
      ok: false,
      status: 403,
      error: 'brand_not_approved',
      message: `Brand "${brand.brandId}" is not approved for API access`,
    };
  }

  return { ok: true, brand };
}

function attachResolvedBrand(req, brand) {
  req.resolvedBrandId = brand.brandId;
  req.resolvedBrand = brand;
}

/**
 * OTP routes — requires active brandId (send, resend, verify).
 */
function validateApprovedBrandForOtp(req, res, next) {
  const brandIdRaw = req.body?.brandId;

  if (!isNonEmptyString(brandIdRaw)) {
    return brandGateError(
      req,
      res,
      400,
      'brand_id_required',
      'brandId is required',
    );
  }

  let normalizedBrandId;
  try {
    normalizedBrandId = normalizeBrandId(brandIdRaw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid brandId';
    return brandGateError(req, res, 400, 'validation_error', message);
  }

  const access = assertBrandIsActive(getBrand(normalizedBrandId));
  if (!access.ok) {
    return brandGateError(req, res, access.status, access.error, access.message);
  }

  attachResolvedBrand(req, access.brand);
  next();
}

/**
 * Notify route — SMS only. Resolves brand from brandId or variables.businessName.
 * Does not alter notify controller validation or DLT payload logic.
 */
function validateApprovedBrandForNotify(req, res, next) {
  const channel = req.body?.channel;
  const normalizedChannel = isNonEmptyString(channel) ? channel.trim().toUpperCase() : 'SMS';

  if (normalizedChannel !== 'SMS') {
    next();
    return;
  }

  const resolution = resolveBrandFromNotifyBody(req.body);
  if (resolution.invalid) {
    return brandGateError(req, res, 400, 'validation_error', resolution.message);
  }
  if (resolution.unknown) {
    return brandGateError(
      req,
      res,
      403,
      'brand_not_approved',
      'Brand is not registered or not approved for API access',
    );
  }
  if (resolution.missing) {
    return brandGateError(
      req,
      res,
      400,
      'brand_id_required',
      'brandId or variables.businessName is required for an approved brand',
    );
  }

  const access = assertBrandIsActive(resolution.brand);
  if (!access.ok) {
    return brandGateError(req, res, access.status, access.error, access.message);
  }

  const smsMode = classifyNotifySmsMode(req.body);
  if (smsMode === 'template') {
    const templateKey = req.body?.templateKey;
    if (isNonEmptyString(templateKey)) {
      const key = templateKey.trim();
      if (!access.brand.templates.notify.includes(key)) {
        return brandGateError(
          req,
          res,
          403,
          'template_not_allowed',
          `Template "${key}" is not enabled for brand "${access.brand.brandId}"`,
        );
      }
    }
  }

  attachResolvedBrand(req, access.brand);
  next();
}

module.exports = {
  validateApprovedBrandForOtp,
  validateApprovedBrandForNotify,
};
