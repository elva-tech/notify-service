const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { getBusiness, getTemplate } = require('../businesses/registry');
const { allowedApps } = require('../config/allowedApps');
const { buildDltPayload } = require('./dltPayloadResolver.service');
const { logSystem } = require('./logging/businessLogger.service');

function isLegacyRouteEnabledForEntry(entry) {
  if (!entry) {
    return true;
  }
  if (entry.legacyRouteEnabled === undefined) {
    return true;
  }
  return entry.legacyRouteEnabled === true;
}

const OTP_MAPPINGS_PATH = path.join(__dirname, '../../config/otp-mappings.json');

/** OTP-capable templates and their required variable names (must match templates.json). */
const OTP_TEMPLATE_VARIABLE_REQUIREMENTS = Object.freeze({
  LOGIN_OTP: Object.freeze(['businessName', 'otp']),
  LOGIN_OTP_WITH_ID: Object.freeze(['businessName', 'loginId', 'otp']),
});

function loadOtpMappingsFile() {
  if (!fs.existsSync(OTP_MAPPINGS_PATH)) {
    throw new Error(`OTP mappings file not found: ${OTP_MAPPINGS_PATH}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(OTP_MAPPINGS_PATH, 'utf8'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'parse error';
    throw new Error(`Invalid otp-mappings.json: ${msg}`);
  }

  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('otp-mappings.json must be a JSON object mapping appId to configuration');
  }

  return parsed;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function validateBooleanField(value, fieldName, appId) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`OTP mapping ${fieldName} for appId "${appId}" must be a boolean`);
  }
}

function validateTemplateOtpVariables(templateKey, template, businessId, appId) {
  const requiredNames = OTP_TEMPLATE_VARIABLE_REQUIREMENTS[templateKey];
  if (!requiredNames) {
    throw new Error(
      `OTP mapping for appId "${appId}" uses unsupported template "${templateKey}" in business "${businessId}"`,
    );
  }

  const definedNames = new Set(
    (Array.isArray(template.variables) ? template.variables : []).map((entry) => entry.name),
  );

  for (const name of requiredNames) {
    if (!definedNames.has(name)) {
      throw new Error(
        `OTP template "${templateKey}" for appId "${appId}" must define variable "${name}"`,
      );
    }
  }
}

function buildSampleOtpVariables(template) {
  const sampleVariables = {};
  for (const entry of Array.isArray(template.variables) ? template.variables : []) {
    if (entry.name === 'otp') {
      sampleVariables.otp = '000000';
    } else if (entry.type === 'numeric') {
      sampleVariables[entry.name] = '1'.repeat(entry.length ?? 4);
    } else if (entry.name.toLowerCase().includes('name')) {
      sampleVariables[entry.name] = 'Sample';
    } else {
      sampleVariables[entry.name] = 'sample';
    }
  }
  return sampleVariables;
}

function validateDltPayloadForMapping(appId, businessId, templateKey, template) {
  const sampleVariables = buildSampleOtpVariables(template);

  try {
    buildDltPayload({
      businessId,
      templateKey,
      template,
      variables: sampleVariables,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DLT payload validation failed';
    throw new Error(
      `OTP DLT metadata incomplete for appId "${appId}" (${businessId}/${templateKey}): ${message}`,
    );
  }
}

function classifyCutoverApps(mappings) {
  const retiredApps = [];
  const hybridApps = [];
  const legacyApps = [];

  for (const [appId, entry] of Object.entries(mappings)) {
    const dltEnabled = entry?.dltEnabled === true;
    const fallbackAllowed = isLegacyRouteEnabledForEntry(entry);
    const dltActive = config.otp.dltEnabled && dltEnabled;

    if (dltActive && !fallbackAllowed) {
      retiredApps.push(appId);
    } else if (dltActive && fallbackAllowed) {
      hybridApps.push(appId);
    } else {
      legacyApps.push(appId);
    }
  }

  return { retiredApps, hybridApps, legacyApps };
}

function validateOtpMappingsAtStartup() {
  const mappings = loadOtpMappingsFile();
  const appIds = Object.keys(mappings);

  if (appIds.length === 0) {
    logOtpDltActivationStatus(mappings);
    logOtpCutoverStatus(mappings);
    return;
  }

  const credentialAppIds = Object.keys(allowedApps);

  for (const appId of appIds) {
    assertNonEmptyString(appId, 'OTP mapping appId');

    const entry = mappings[appId];
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`OTP mapping for appId "${appId}" must be an object`);
    }

    const businessId = assertNonEmptyString(entry.business, `OTP mapping business (${appId})`);
    const templateKey = assertNonEmptyString(entry.templateKey, `OTP mapping templateKey (${appId})`);
    validateBooleanField(entry.dltEnabled, 'dltEnabled', appId);
    validateBooleanField(entry.legacyRouteEnabled, 'legacyRouteEnabled', appId);

    if (credentialAppIds.length > 0 && !Object.prototype.hasOwnProperty.call(allowedApps, appId)) {
      throw new Error(`OTP mapping appId "${appId}" not found in APP_CREDENTIALS_JSON`);
    }

    const business = getBusiness(businessId);
    if (!business) {
      throw new Error(`OTP mapping for appId "${appId}" references unknown business "${businessId}"`);
    }

    const template = getTemplate(businessId, templateKey);
    if (!template) {
      throw new Error(
        `OTP mapping for appId "${appId}" references unknown template "${templateKey}" in business "${businessId}"`,
      );
    }

    validateTemplateOtpVariables(templateKey, template, businessId, appId);

    if (config.otp.dltEnabled && entry.dltEnabled === true) {
      validateDltPayloadForMapping(appId, businessId, templateKey, template);
    }
  }

  logOtpDltActivationStatus(mappings);
  logOtpCutoverStatus(mappings);
}

function logOtpDltActivationStatus(mappings) {
  const enabledApps = [];
  const legacyApps = [];

  for (const [appId, entry] of Object.entries(mappings)) {
    if (entry?.dltEnabled === true) {
      enabledApps.push(appId);
    } else {
      legacyApps.push(appId);
    }
  }

  logSystem('otp_dlt_activation_status', 'completed', {}, {
    globalEnabled: config.otp.dltEnabled,
    enabledApps,
    legacyApps,
  });
}

function logOtpCutoverStatus(mappings) {
  const { retiredApps, hybridApps, legacyApps } = classifyCutoverApps(mappings);

  logSystem('otp_cutover_status', 'completed', {}, {
    globalEnabled: config.otp.dltEnabled,
    retiredApps,
    hybridApps,
    legacyApps,
    mappingCount: Object.keys(mappings).length,
  });

  if (retiredApps.length > 0) {
    logSystem('otp_legacy_route_retired', 'completed', {}, {
      retiredApps,
      count: retiredApps.length,
    });
  }
}

module.exports = {
  OTP_MAPPINGS_PATH,
  OTP_TEMPLATE_VARIABLE_REQUIREMENTS,
  loadOtpMappingsFile,
  validateOtpMappingsAtStartup,
  classifyCutoverApps,
};
