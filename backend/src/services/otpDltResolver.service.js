/**
 * OTP DLT resolver — resolves appId → business/template metadata and delivery policy.
 */

const config = require('../config/env');
const { getBusiness, getTemplate } = require('../businesses/registry');
const { getBrand } = require('./brandRegistry.service');
const { normalizeBrandId } = require('../utils/brandId');
const { loadOtpMappingsFile } = require('./otpMappingValidator.service');

let cachedMappings = null;

function getOtpMappings() {
  if (!cachedMappings) {
    cachedMappings = loadOtpMappingsFile();
  }
  return cachedMappings;
}

function getOtpMappingEntry(appId) {
  if (typeof appId !== 'string' || !appId.trim()) {
    return null;
  }
  const entry = getOtpMappings()[appId.trim()];
  if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  return entry;
}

/**
 * @param {object | null | undefined} entry
 * @returns {boolean}
 */
function isLegacyRouteEnabledForOtpPolicy(otpPolicy) {
  if (!otpPolicy) {
    return true;
  }
  if (otpPolicy.legacyRouteEnabled === undefined) {
    return true;
  }
  return otpPolicy.legacyRouteEnabled === true;
}

/**
 * @param {string} brandId
 * @returns {object}
 */
function resolveBrandForOtp(brandId) {
  const normalizedBrandId = normalizeBrandId(brandId);
  const brand = getBrand(normalizedBrandId);
  if (!brand) {
    throw new Error(`Unknown brandId "${normalizedBrandId}"`);
  }
  if (!brand.templates.otp.length) {
    throw new Error(`Brand "${normalizedBrandId}" does not have OTP templates enabled`);
  }
  return brand;
}

/**
 * DLT OTP delivery for a brand when global flag and per-brand dltEnabled are both true.
 * @param {string} brandId
 * @returns {boolean}
 */
function isOtpDltEnabledForBrand(brandId) {
  if (!config.otp.dltEnabled) {
    return false;
  }
  const brand = resolveBrandForOtp(brandId);
  return brand.otpPolicy.dltEnabled === true;
}

/**
 * Per-brand legacy route=q fallback is allowed (hybrid mode).
 * @param {string} brandId
 * @returns {boolean}
 */
function isLegacyFallbackAllowedForBrand(brandId) {
  const brand = resolveBrandForOtp(brandId);
  return isLegacyRouteEnabledForOtpPolicy(brand.otpPolicy);
}

/**
 * DLT-only mode for a brand: no route=q on inactive routing or provider failure.
 * @param {string} brandId
 * @returns {boolean}
 */
function isDltOnlyForBrand(brandId) {
  return isOtpDltEnabledForBrand(brandId) && !isLegacyFallbackAllowedForBrand(brandId);
}

/**
 * @param {string} brandId
 * @returns {{
 *   brandId: string,
 *   brandName: string,
 *   dltActive: boolean,
 *   fallbackAllowed: boolean,
 *   deliveryPolicy: 'dlt_only' | 'hybrid' | 'legacy_q',
 *   businessId?: string,
 *   templateKey?: string,
 *   templateId?: string | null
 * }}
 */
function getOtpDeliveryPolicyByBrand(brandId) {
  let normalizedBrandId;
  try {
    normalizedBrandId = normalizeBrandId(brandId);
  } catch {
    return {
      brandId: brandId ?? '',
      brandName: '',
      dltActive: false,
      fallbackAllowed: true,
      deliveryPolicy: 'legacy_q',
    };
  }

  let brand;
  try {
    brand = resolveBrandForOtp(normalizedBrandId);
  } catch {
    return {
      brandId: normalizedBrandId,
      brandName: '',
      dltActive: false,
      fallbackAllowed: true,
      deliveryPolicy: 'legacy_q',
    };
  }

  const dltActive = isOtpDltEnabledForBrand(normalizedBrandId);
  const fallbackAllowed = isLegacyFallbackAllowedForBrand(normalizedBrandId);

  let deliveryPolicy = 'legacy_q';
  if (dltActive && !fallbackAllowed) {
    deliveryPolicy = 'dlt_only';
  } else if (dltActive && fallbackAllowed) {
    deliveryPolicy = 'hybrid';
  }

  const businessId = brand.businessModule;
  const templateKey = brand.otpPolicy.templateKey;
  const template = getTemplate(businessId, templateKey);
  const templateId = template?.dlt?.templateId ?? null;

  return {
    brandId: normalizedBrandId,
    brandName: brand.brandName,
    dltActive,
    fallbackAllowed,
    deliveryPolicy,
    businessId,
    templateKey,
    templateId,
  };
}

/**
 * @param {string} brandId
 * @returns {{ brandId: string, brandName: string, businessId: string, templateKey: string, business: object, dltEnabled: boolean, legacyRouteEnabled: boolean }}
 */
function resolveOtpConfigurationByBrand(brandId) {
  const brand = resolveBrandForOtp(brandId);
  const businessId = brand.businessModule;
  const business = getBusiness(businessId);

  if (!business) {
    throw new Error(`Business module "${businessId}" not found for brandId "${brand.brandId}"`);
  }

  return {
    brandId: brand.brandId,
    brandName: brand.brandName,
    businessId,
    templateKey: brand.otpPolicy.templateKey,
    dltEnabled: brand.otpPolicy.dltEnabled === true,
    legacyRouteEnabled: isLegacyRouteEnabledForOtpPolicy(brand.otpPolicy),
    business,
  };
}

/**
 * @param {string} brandId
 * @returns {object}
 */
function resolveOtpTemplateByBrand(brandId) {
  const resolved = resolveOtpConfigurationByBrand(brandId);
  const template = getTemplate(resolved.businessId, resolved.templateKey);

  if (!template) {
    throw new Error(
      `Template "${resolved.templateKey}" not found for brandId "${resolved.brandId}"`,
    );
  }

  return template;
}

/**
 * Resolves a single OTP template variable value.
 * businessName defaults to the brand registry display name when not explicitly provided.
 *
 * @param {{ name: string }} entry
 * @param {Record<string, unknown>} input
 * @param {string} defaultBrandName
 * @returns {string | null}
 */
function resolveOtpVariableValue(entry, input, defaultBrandName) {
  if (entry.name === 'otp') {
    return null;
  }

  const explicit = input?.[entry.name];
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }

  if (entry.name === 'businessName') {
    return defaultBrandName.trim();
  }

  return null;
}

/**
 * @param {{ brandId: string, otp: string, appId?: string, loginId?: string, businessName?: string, [key: string]: unknown }} input
 * @returns {{ businessId: string, templateKey: string, template: object, variables: Record<string, string>, brandId: string, brandName: string }}
 */
function buildOtpTemplateContext(input) {
  const brandId = input?.brandId;
  const otp = input?.otp;

  if (typeof brandId !== 'string' || !brandId.trim()) {
    throw new Error('brandId is required');
  }
  if (typeof otp !== 'string' || !otp.trim()) {
    throw new Error('otp is required');
  }

  const resolved = resolveOtpConfigurationByBrand(brandId);
  const template = resolveOtpTemplateByBrand(brandId);
  const variables = { otp: otp.trim() };

  for (const entry of Array.isArray(template.variables) ? template.variables : []) {
    if (entry.name === 'otp') {
      continue;
    }
    const value = resolveOtpVariableValue(entry, input, resolved.brandName);
    if (value == null) {
      throw new Error(`${entry.name} is required for this OTP template`);
    }
    variables[entry.name] = value;
  }

  return {
    brandId: resolved.brandId,
    brandName: resolved.brandName,
    businessId: resolved.businessId,
    templateKey: resolved.templateKey,
    template,
    variables,
  };
}

function isLegacyRouteEnabledForEntry(entry) {
  if (!entry) {
    return true;
  }
  if (entry.legacyRouteEnabled === undefined) {
    return true;
  }
  return entry.legacyRouteEnabled === true;
}

/**
 * DLT OTP delivery is active when global flag and per-app dltEnabled are both true.
 * @param {string} appId
 * @returns {boolean}
 */
function isOtpDltEnabled(appId) {
  if (!config.otp.dltEnabled) {
    return false;
  }
  const entry = getOtpMappingEntry(appId);
  return entry?.dltEnabled === true;
}

/**
 * Per-app legacy route=q fallback is allowed (hybrid mode).
 * @param {string} appId
 * @returns {boolean}
 */
function isLegacyFallbackAllowed(appId) {
  const entry = getOtpMappingEntry(appId);
  return isLegacyRouteEnabledForEntry(entry);
}

/**
 * DLT-only mode: no route=q on inactive routing or provider failure.
 * @param {string} appId
 * @returns {boolean}
 */
function isDltOnly(appId) {
  return isOtpDltEnabled(appId) && !isLegacyFallbackAllowed(appId);
}

/**
 * @param {string} appId
 * @returns {{
 *   appId: string,
 *   dltActive: boolean,
 *   fallbackAllowed: boolean,
 *   deliveryPolicy: 'dlt_only' | 'hybrid' | 'legacy_q',
 *   businessId?: string,
 *   templateKey?: string,
 *   templateId?: string | null
 * }}
 */
function getOtpDeliveryPolicy(appId) {
  if (typeof appId !== 'string' || !appId.trim()) {
    return {
      appId: appId ?? '',
      dltActive: false,
      fallbackAllowed: true,
      deliveryPolicy: 'legacy_q',
    };
  }

  const normalizedAppId = appId.trim();
  const entry = getOtpMappingEntry(normalizedAppId);
  const dltActive = isOtpDltEnabled(normalizedAppId);
  const fallbackAllowed = isLegacyFallbackAllowed(normalizedAppId);

  let deliveryPolicy = 'legacy_q';
  if (dltActive && !fallbackAllowed) {
    deliveryPolicy = 'dlt_only';
  } else if (dltActive && fallbackAllowed) {
    deliveryPolicy = 'hybrid';
  }

  let businessId;
  let templateKey;
  let templateId = null;
  if (entry) {
    businessId = entry.business;
    templateKey = entry.templateKey;
    const template = getTemplate(businessId, templateKey);
    templateId = template?.dlt?.templateId ?? null;
  }

  return {
    appId: normalizedAppId,
    dltActive,
    fallbackAllowed,
    deliveryPolicy,
    businessId,
    templateKey,
    templateId,
  };
}

function resolveOtpMappingEntry(appId) {
  if (typeof appId !== 'string' || !appId.trim()) {
    throw new Error('appId is required');
  }

  const normalizedAppId = appId.trim();
  const mappings = getOtpMappings();
  const entry = mappings[normalizedAppId];

  if (!entry) {
    throw new Error(`No OTP mapping configured for appId "${normalizedAppId}"`);
  }

  return {
    appId: normalizedAppId,
    businessId: entry.business,
    templateKey: entry.templateKey,
    dltEnabled: entry.dltEnabled === true,
    legacyRouteEnabled: isLegacyRouteEnabledForEntry(entry),
  };
}

/**
 * @param {string} appId
 * @returns {{ appId: string, businessId: string, templateKey: string, business: object, dltEnabled: boolean, legacyRouteEnabled: boolean }}
 */
function resolveOtpConfiguration(appId) {
  const mapping = resolveOtpMappingEntry(appId);
  const business = getBusiness(mapping.businessId);

  if (!business) {
    throw new Error(`Business "${mapping.businessId}" not found for appId "${mapping.appId}"`);
  }

  return {
    appId: mapping.appId,
    businessId: mapping.businessId,
    templateKey: mapping.templateKey,
    dltEnabled: mapping.dltEnabled,
    legacyRouteEnabled: mapping.legacyRouteEnabled,
    business,
  };
}

/**
 * @param {string} appId
 * @returns {object}
 */
function resolveOtpTemplate(appId) {
  const resolved = resolveOtpConfiguration(appId);
  const template = getTemplate(resolved.businessId, resolved.templateKey);

  if (!template) {
    throw new Error(
      `Template "${resolved.templateKey}" not found for appId "${resolved.appId}"`,
    );
  }

  return template;
}

module.exports = {
  isOtpDltEnabled,
  isLegacyFallbackAllowed,
  isDltOnly,
  getOtpDeliveryPolicy,
  getOtpMappingEntry,
  isLegacyRouteEnabledForEntry,
  resolveOtpConfiguration,
  resolveOtpTemplate,
  isOtpDltEnabledForBrand,
  isLegacyFallbackAllowedForBrand,
  isDltOnlyForBrand,
  getOtpDeliveryPolicyByBrand,
  resolveOtpConfigurationByBrand,
  resolveOtpTemplateByBrand,
  buildOtpTemplateContext,
};
