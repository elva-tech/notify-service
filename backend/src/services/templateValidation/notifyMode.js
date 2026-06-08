/**
 * Classifies SMS notify request bodies for legacy vs template validation paths.
 */

const { getBusiness } = require('../../businesses');
const { getOtpMappingEntry } = require('../otpDltResolver.service');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasTemplateFields(body) {
  if (body == null || typeof body !== 'object') {
    return false;
  }
  return isNonEmptyString(body.templateKey);
}

function hasLegacyMessage(body) {
  if (body == null || typeof body !== 'object') {
    return false;
  }
  return isNonEmptyString(body.message);
}

/**
 * Resolves the business module id for DLT template notify requests.
 * `appId` identifies the tenant. When it matches a registered business id (e.g. "enandi"),
 * that module is used. Otherwise, `otp-mappings.json` is consulted (e.g. CMS → enandi).
 * The legacy `business` field is accepted when it matches the resolved id but is not required.
 *
 * @param {object} body
 * @returns {{ businessId: string } | { error: string }}
 */
function resolveNotifyBusinessId(body) {
  const explicitBusiness = isNonEmptyString(body?.business) ? body.business.trim() : null;
  const appId = isNonEmptyString(body?.appId) ? body.appId.trim() : null;

  if (explicitBusiness && appId && explicitBusiness.toLowerCase() !== appId.toLowerCase()) {
    return {
      error: 'business must match appId. Use appId only — it identifies your business module.',
    };
  }

  const candidate = explicitBusiness ?? (appId ? appId.toLowerCase() : null);
  if (!candidate) {
    return { error: 'appId is required for DLT template SMS' };
  }

  if (getBusiness(candidate)) {
    return { businessId: candidate };
  }

  if (appId) {
    const mapping = getOtpMappingEntry(appId);
    const mappedBusiness =
      typeof mapping?.business === 'string' ? mapping.business.trim().toLowerCase() : null;
    if (mappedBusiness && getBusiness(mappedBusiness)) {
      return { businessId: mappedBusiness };
    }
  }

  return { error: `Unsupported business: ${candidate}` };
}

/**
 * @param {object} body
 * @returns {'legacy' | 'template' | 'mixed' | 'neither'}
 */
function classifyNotifySmsMode(body) {
  const template = hasTemplateFields(body);
  const legacy = hasLegacyMessage(body);

  if (template && legacy) {
    return 'mixed';
  }
  if (template) {
    return 'template';
  }
  if (legacy) {
    return 'legacy';
  }
  return 'neither';
}

module.exports = {
  classifyNotifySmsMode,
  hasTemplateFields,
  hasLegacyMessage,
  resolveNotifyBusinessId,
};
