const fs = require('fs');
const path = require('path');
const {
  BUSINESSES_CONFIG_ROOT,
  discoverBusinessFolders,
  loadBusinessModuleFromFolder,
} = require('../businesses/configLoader');
const { loadOtpMappingsFile } = require('./otpMappingValidator.service');

const PLACEHOLDER_PATTERNS = [
  /REPLACE/i,
  /TODO/i,
  /CHANGEME/i,
  /^X+$/i,
  /^0+$/,
  /^sample-/i,
];

const BUSINESS_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
function isPlaceholderValue(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return true;
  }
  const trimmed = value.trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * @param {string} businessId
 * @returns {boolean}
 */
function isValidBusinessIdFormat(businessId) {
  return typeof businessId === 'string' && BUSINESS_ID_PATTERN.test(businessId);
}

/**
 * @returns {Map<string, string[]>}
 */
function loadOtpMappingsByBusiness() {
  const byBusiness = new Map();
  try {
    const mappings = loadOtpMappingsFile();
    for (const [appId, entry] of Object.entries(mappings)) {
      if (!entry?.business) {
        continue;
      }
      const list = byBusiness.get(entry.business) ?? [];
      list.push(appId);
      byBusiness.set(entry.business, list);
    }
  } catch {
    // OTP mappings optional for audit
  }
  return byBusiness;
}

/**
 * @param {string} folderName
 * @param {Map<string, string[]>} otpByBusiness
 * @returns {{ businessId: string, displayName: string, version: string, validationStatus: string, readinessStatus: string, checklist: object, templateCount: number, issues: object[], warnings: object[] }}
 */
function auditBusinessFolder(folderName, otpByBusiness) {
  const issues = [];
  const warnings = [];
  let businessMeta = null;
  let templateCount = 0;
  let businessJsonValid = false;
  let templatesJsonValid = false;
  let dltMetadataComplete = false;

  if (!isValidBusinessIdFormat(folderName)) {
    issues.push({
      level: 'FAIL',
      code: 'invalid_business_id_format',
      message: `Folder name "${folderName}" must match ${BUSINESS_ID_PATTERN}`,
    });
  }

  try {
    const module = loadBusinessModuleFromFolder(folderName);
    businessMeta = {
      businessId: module.businessId,
      displayName: module.displayName,
      version: module.version,
    };
    businessJsonValid = true;
    templatesJsonValid = true;
    templateCount = module.listTemplateKeys().length;

    const dltPlaceholders = [];
    if (isPlaceholderValue(module.dlt.entityId)) {
      dltPlaceholders.push('dlt.entityId');
    }
    if (isPlaceholderValue(module.dlt.defaultSenderId)) {
      dltPlaceholders.push('dlt.defaultSenderId');
    }

    let templatePlaceholders = 0;
    for (const templateKey of module.listTemplateKeys()) {
      const template = module.getTemplate(templateKey);
      if (isPlaceholderValue(template?.dlt?.templateId)) {
        templatePlaceholders += 1;
        warnings.push({
          level: 'WARN',
          code: 'placeholder_template_id',
          message: `Template "${templateKey}" has placeholder templateId`,
        });
      }
      if (isPlaceholderValue(template?.dlt?.messageId)) {
        templatePlaceholders += 1;
        warnings.push({
          level: 'WARN',
          code: 'placeholder_message_id',
          message: `Template "${templateKey}" has placeholder messageId`,
        });
      }
    }

    if (dltPlaceholders.length > 0) {
      for (const field of dltPlaceholders) {
        warnings.push({
          level: 'WARN',
          code: 'placeholder_dlt_field',
          message: `Business "${folderName}" has placeholder ${field}`,
        });
      }
    }

    dltMetadataComplete = dltPlaceholders.length === 0 && templatePlaceholders === 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Business configuration validation failed';
    if (message.includes('business.json')) {
      businessJsonValid = false;
    }
    if (message.includes('templates.json') || message.includes('Template')) {
      templatesJsonValid = false;
    }
    issues.push({
      level: 'FAIL',
      code: 'schema_validation_failed',
      message,
    });
  }

  const otpApps = otpByBusiness.get(folderName) ?? [];
  const otpMappingConfigured = otpApps.length > 0;
  if (!otpMappingConfigured) {
    warnings.push({
      level: 'WARN',
      code: 'otp_mapping_missing',
      message: `No OTP mapping references business "${folderName}"`,
    });
  }

  const productionReady = businessJsonValid
    && templatesJsonValid
    && dltMetadataComplete
    && issues.length === 0;

  let readinessStatus = 'Draft';
  if (productionReady && otpMappingConfigured) {
    readinessStatus = 'Production';
  } else if (productionReady) {
    readinessStatus = 'Ready';
  } else if (businessJsonValid && templatesJsonValid) {
    readinessStatus = 'Draft';
  } else {
    readinessStatus = 'Invalid';
  }

  const validationStatus = issues.length > 0
    ? 'FAIL'
    : warnings.length > 0
      ? 'WARN'
      : 'PASS';

  return {
    businessId: businessMeta?.businessId ?? folderName,
    displayName: businessMeta?.displayName ?? folderName,
    version: businessMeta?.version ?? 'unknown',
    validationStatus,
    readinessStatus,
    checklist: {
      businessJsonValid,
      templatesJsonValid,
      dltMetadataComplete,
      otpMappingConfigured,
      productionReady,
    },
    templateCount,
    otpAppIds: otpApps,
    issues,
    warnings,
  };
}

/**
 * @returns {{ businessCount: number, healthyBusinesses: number, draftBusinesses: number, productionBusinesses: number, businesses: object[], globalIssues: object[] }}
 */
function buildBusinessHealthSnapshot() {
  const folders = discoverBusinessFolders();
  const otpByBusiness = loadOtpMappingsByBusiness();
  const globalIssues = [];
  const businessIds = new Set();

  const businesses = folders.map((folderName) => {
    const audit = auditBusinessFolder(folderName, otpByBusiness);
    if (businessIds.has(audit.businessId)) {
      globalIssues.push({
        level: 'FAIL',
        code: 'duplicate_business_id',
        message: `Duplicate businessId "${audit.businessId}"`,
      });
    }
    businessIds.add(audit.businessId);
    return audit;
  });

  const healthyBusinesses = businesses.filter((b) => b.validationStatus === 'PASS').length;
  const draftBusinesses = businesses.filter((b) => b.readinessStatus === 'Draft').length;
  const productionBusinesses = businesses.filter((b) => b.readinessStatus === 'Production').length;

  return {
    businessCount: businesses.length,
    healthyBusinesses,
    draftBusinesses,
    productionBusinesses,
    businesses,
    globalIssues,
  };
}

/**
 * @param {'startup' | 'script' | 'cli'} source
 * @returns {object | null}
 */
function writeBusinessHealthSnapshot(source = 'startup') {
  const snapshotDir = path.join(__dirname, '../../.generated');
  const snapshotPath = path.join(snapshotDir, 'business-health-snapshot.json');

  try {
    const health = buildBusinessHealthSnapshot();
    const snapshot = {
      generatedAt: new Date().toISOString(),
      source,
      ...health,
    };
    fs.mkdirSync(snapshotDir, { recursive: true });
    fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    return snapshot;
  } catch (err) {
    return null;
  }
}

/**
 * @returns {{ status: 'PASS' | 'WARN' | 'FAIL', diagnostics: object[] }}
 */
function validateAllBusinessConfigs() {
  const health = buildBusinessHealthSnapshot();
  const diagnostics = [];

  for (const issue of health.globalIssues) {
    diagnostics.push(issue);
  }

  for (const business of health.businesses) {
    for (const issue of business.issues) {
      diagnostics.push({
        ...issue,
        businessId: business.businessId,
      });
    }
    for (const warning of business.warnings) {
      diagnostics.push({
        ...warning,
        businessId: business.businessId,
      });
    }
  }

  let status = 'PASS';
  if (diagnostics.some((d) => d.level === 'FAIL')) {
    status = 'FAIL';
  } else if (diagnostics.some((d) => d.level === 'WARN')) {
    status = 'WARN';
  }

  return { status, diagnostics, health };
}

module.exports = {
  BUSINESS_ID_PATTERN,
  SNAPSHOT_PATH: path.join(__dirname, '../../.generated/business-health-snapshot.json'),
  isPlaceholderValue,
  isValidBusinessIdFormat,
  auditBusinessFolder,
  buildBusinessHealthSnapshot,
  writeBusinessHealthSnapshot,
  validateAllBusinessConfigs,
};
