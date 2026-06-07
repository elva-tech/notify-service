/**
 * Platform metadata — read-only business/template exposure from the runtime registry.
 * Source of truth: backend/config/businesses/<businessId>/ (loaded at startup).
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { listBusinesses, getBusiness, getTemplate } = require('../businesses');
const {
  buildOtpHealthSnapshot,
  readOtpHealthSnapshot,
} = require('./otpHealthSnapshot.service');
const { loadOtpMappingsFile } = require('./otpMappingValidator.service');

const BUSINESS_HEALTH_SNAPSHOT_PATH = path.join(
  __dirname,
  '../../.generated/business-health-snapshot.json',
);

function buildSearchText(parts) {
  return parts.filter((part) => part != null && String(part).trim()).join(' ');
}

function buildExampleVariableValue(variable) {
  switch (variable.type) {
    case 'numeric':
      return '1'.repeat(variable.length ?? 6);
    case 'date':
      return '2026-06-06';
    case 'datetime':
      return '2026-06-06 14:30';
    case 'time':
      return '14:30';
    case 'string':
    default:
      if (variable.name.toLowerCase().includes('customer')) {
        return 'Arun';
      }
      if (variable.name.toLowerCase().includes('business')) {
        return 'eNandi';
      }
      if (variable.name.toLowerCase().includes('order')) {
        return 'ORD-2026-001';
      }
      if (variable.name.toLowerCase().includes('login')) {
        return '7488';
      }
      return 'sample-value';
  }
}

function buildExampleNotifyPayload(businessId, templateKey, variables) {
  const exampleVariables = {};
  for (const variable of variables) {
    if (variable.name === 'otp') {
      continue;
    }
    exampleVariables[variable.name] = buildExampleVariableValue(variable);
  }

  return {
    appId: 'your-app-id',
    apiKey: '[REDACTED]',
    channel: 'SMS',
    to: ['919876543210'],
    templateKey,
    variables: exampleVariables,
  };
}

function serializeVariable(variable) {
  return {
    name: variable.name,
    position: variable.position,
    type: variable.type,
    required: variable.required,
    ...(variable.pattern != null ? { pattern: variable.pattern } : {}),
    ...(variable.length != null ? { length: variable.length } : {}),
    ...(variable.digitsOnly != null ? { digitsOnly: variable.digitsOnly } : {}),
    ...(variable.maxLength != null ? { maxLength: variable.maxLength } : {}),
    ...(variable.format != null ? { format: variable.format } : {}),
  };
}

function inferDeliveryType(template) {
  const hasOtpVariable = template.variables.some((variable) => variable.name === 'otp');
  return hasOtpVariable ? 'OTP DLT' : 'Notify DLT';
}

function serializeTemplate(business, templateKey) {
  const template = business.getTemplate(templateKey);
  if (!template) {
    return null;
  }

  const variables = template.variables.map(serializeVariable);
  const templateId = template.dlt.templateId;
  const messageId = template.dlt.messageId;
  const senderId = template.dlt.senderId;
  const entityId = template.dlt.entityId;

  return {
    templateKey: template.templateKey,
    purpose: template.purpose,
    templateId,
    messageId,
    senderId,
    entityId,
    variables,
    deliveryType: inferDeliveryType(template),
    examplePayload: buildExampleNotifyPayload(business.businessId, templateKey, variables),
    searchText: buildSearchText([
      business.businessId,
      business.displayName,
      business.version,
      templateKey,
      template.purpose,
      templateId,
      messageId,
      senderId,
      entityId,
      variables.map((variable) => `${variable.name} ${variable.type}`).join(' '),
    ]),
  };
}

function readBusinessHealthSnapshot() {
  try {
    if (!fs.existsSync(BUSINESS_HEALTH_SNAPSHOT_PATH)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(BUSINESS_HEALTH_SNAPSHOT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function mergeBusinessHealth(business, healthSnapshot) {
  const healthEntry = healthSnapshot?.businesses?.find(
    (entry) => entry.businessId === business.businessId,
  );

  if (!healthEntry) {
    return {
      templateCount: business.listTemplateKeys().length,
    };
  }

  return {
    readinessStatus: healthEntry.readinessStatus,
    validationStatus: healthEntry.validationStatus,
    checklist: healthEntry.checklist,
    templateCount: healthEntry.templateCount,
    otpAppIds: healthEntry.otpAppIds,
    issues: healthEntry.issues,
    warnings: healthEntry.warnings,
  };
}

function serializeBusiness(business, { includeTemplates = true } = {}) {
  const templateKeys = business.listTemplateKeys();
  const templates = includeTemplates
    ? templateKeys
        .map((templateKey) => serializeTemplate(business, templateKey))
        .filter(Boolean)
    : [];

  const healthSnapshot = readBusinessHealthSnapshot();
  const health = mergeBusinessHealth(business, healthSnapshot);

  const searchText = buildSearchText([
    business.businessId,
    business.displayName,
    business.version,
    business.dlt.defaultSenderId,
    business.dlt.entityId,
    ...templates.map((template) => template.searchText),
  ]);

  return {
    businessId: business.businessId,
    displayName: business.displayName,
    version: business.version,
    dlt: {
      entityId: business.dlt.entityId,
      defaultSenderId: business.dlt.defaultSenderId,
    },
    templates,
    templateKeys,
    searchText,
    ...health,
  };
}

function buildPlatformStats(businesses) {
  const templateCount = businesses.reduce((sum, business) => sum + business.templates.length, 0);
  const variableCount = businesses.reduce(
    (sum, business) =>
      sum + business.templates.reduce((inner, template) => inner + template.variables.length, 0),
    0,
  );
  const versions = new Set(businesses.map((business) => business.version));

  return {
    businessCount: businesses.length,
    templateCount,
    dltTemplateCount: templateCount,
    variableCount,
    versionCount: versions.size,
  };
}

function listPlatformBusinesses() {
  const businesses = listBusinesses()
    .map((businessId) => getBusiness(businessId))
    .filter(Boolean)
    .map((business) => serializeBusiness(business, { includeTemplates: true }));

  const healthSnapshot = readBusinessHealthSnapshot();

  return {
    generatedAt: new Date().toISOString(),
    stats: buildPlatformStats(businesses),
    businesses,
    businessHealth: healthSnapshot,
  };
}

function getPlatformBusiness(businessId) {
  const business = getBusiness(businessId);
  if (!business) {
    return null;
  }
  return serializeBusiness(business, { includeTemplates: true });
}

function listPlatformTemplates(businessId) {
  const business = getBusiness(businessId);
  if (!business) {
    return null;
  }

  const templates = business
    .listTemplateKeys()
    .map((templateKey) => serializeTemplate(business, templateKey))
    .filter(Boolean);

  return {
    businessId: business.businessId,
    displayName: business.displayName,
    version: business.version,
    dlt: business.dlt,
    templates,
  };
}

function getPlatformTemplate(businessId, templateKey) {
  const business = getBusiness(businessId);
  if (!business) {
    return null;
  }

  const template = serializeTemplate(business, templateKey);
  if (!template) {
    return null;
  }

  return {
    businessId: business.businessId,
    displayName: business.displayName,
    version: business.version,
    dlt: business.dlt,
    template,
  };
}

function buildOtpMappingsSection() {
  const globalDltEnabled = config.otp.dltEnabled === true;
  let raw;
  try {
    raw = loadOtpMappingsFile();
  } catch {
    return {
      runtime: { globalDltEnabled },
      stats: {
        mappingCount: 0,
        businessCount: 0,
        templateCount: 0,
        dltEnabledCount: 0,
        legacyCount: 0,
        dltOnlyCount: 0,
        hybridCount: 0,
        legacyRouteCount: 0,
        retirementPercent: 0,
      },
      mappings: [],
    };
  }

  const mappings = [];
  const referencedBusinesses = new Set();
  const referencedTemplates = new Set();
  let dltEnabledCount = 0;
  let legacyCount = 0;
  let dltOnlyCount = 0;
  let hybridCount = 0;
  let legacyRouteCount = 0;

  for (const [appId, entry] of Object.entries(raw)) {
    const business = getBusiness(entry.business);
    const template = getTemplate(entry.business, entry.templateKey);
    const dltEnabled = entry.dltEnabled === true;
    const legacyRouteEnabled = entry.legacyRouteEnabled !== false;
    const fallbackAllowed = legacyRouteEnabled;

    if (dltEnabled) {
      dltEnabledCount += 1;
    } else {
      legacyCount += 1;
    }

    if (dltEnabled && !legacyRouteEnabled) {
      dltOnlyCount += 1;
    } else if (dltEnabled && legacyRouteEnabled) {
      hybridCount += 1;
    }

    if (legacyRouteEnabled) {
      legacyRouteCount += 1;
    }

    referencedBusinesses.add(entry.business);
    referencedTemplates.add(`${entry.business}/${entry.templateKey}`);

    const deliveryPolicy =
      !dltEnabled || !globalDltEnabled
        ? 'legacy_q'
        : !fallbackAllowed
          ? 'dlt_only'
          : 'hybrid';

    const deliveryMode =
      !dltEnabled || !globalDltEnabled
        ? 'legacy_q'
        : !fallbackAllowed
          ? 'dlt_only'
          : 'dlt';

    const retirementStatus =
      !dltEnabled || !globalDltEnabled
        ? 'Legacy'
        : !fallbackAllowed
          ? 'Fully Retired'
          : 'Hybrid';

    mappings.push({
      appId,
      businessId: entry.business,
      displayName: business?.displayName ?? entry.business,
      templateKey: entry.templateKey,
      templateId: template?.dlt?.templateId ?? null,
      messageId: template?.dlt?.messageId ?? null,
      senderId: template?.dlt?.senderId ?? business?.dlt?.defaultSenderId ?? null,
      entityId: template?.dlt?.entityId ?? business?.dlt?.entityId ?? null,
      purpose: template?.purpose ?? null,
      variables: template?.variables?.map(serializeVariable) ?? [],
      dltEnabled,
      legacyRouteEnabled,
      fallbackAllowed,
      deliveryPolicy,
      deliveryMode,
      retirementStatus,
      rolloutReady: Boolean(template),
      dltMetadataComplete: Boolean(template?.dlt?.templateId && template?.dlt?.messageId),
      activeDlt: dltEnabled && globalDltEnabled,
      searchText: buildSearchText([
        appId,
        entry.business,
        business?.displayName,
        entry.templateKey,
        template?.dlt?.templateId,
        template?.dlt?.messageId,
        template?.dlt?.senderId,
        template?.dlt?.entityId,
        deliveryPolicy,
        deliveryMode,
        retirementStatus,
      ]),
    });
  }

  const retiredApps = mappings.filter((m) => m.dltEnabled && !m.legacyRouteEnabled).length;

  return {
    runtime: { globalDltEnabled },
    stats: {
      mappingCount: mappings.length,
      businessCount: referencedBusinesses.size,
      templateCount: referencedTemplates.size,
      dltEnabledCount,
      legacyCount,
      dltOnlyCount,
      hybridCount,
      legacyRouteCount,
      retirementPercent: mappings.length ? Math.round((retiredApps / mappings.length) * 100) : 0,
    },
    mappings,
  };
}

function getPlatformOtpMetadata() {
  const otpMappings = buildOtpMappingsSection();
  const otpHealth = readOtpHealthSnapshot() ?? buildOtpHealthSnapshot();

  return {
    generatedAt: new Date().toISOString(),
    otpMappings,
    otpHealth,
  };
}

module.exports = {
  listPlatformBusinesses,
  getPlatformBusiness,
  listPlatformTemplates,
  getPlatformTemplate,
  getPlatformOtpMetadata,
  inferDeliveryType,
  serializeTemplate,
};
