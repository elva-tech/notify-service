/**
 * OTP DLT health snapshot — config health, cutover, and retirement readiness.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { getBusiness, getTemplate } = require('../businesses/registry');
const { loadOtpMappingsFile, classifyCutoverApps } = require('./otpMappingValidator.service');
const { allowedApps } = require('../config/allowedApps');
const { logSystem } = require('./logging/businessLogger.service');

const SNAPSHOT_PATH = path.join(__dirname, '../../.generated/otp-health-snapshot.json');

function isLegacyRouteEnabledForEntry(entry) {
  if (!entry) {
    return true;
  }
  if (entry.legacyRouteEnabled === undefined) {
    return true;
  }
  return entry.legacyRouteEnabled === true;
}

function resolveDeliveryPolicy(dltActive, fallbackAllowed) {
  if (!dltActive) {
    return 'legacy_q';
  }
  if (!fallbackAllowed) {
    return 'dlt_only';
  }
  return 'hybrid';
}

function resolveRetirementStatus(dltActive, fallbackAllowed) {
  if (!dltActive) {
    return 'Legacy';
  }
  if (!fallbackAllowed) {
    return 'Fully Retired';
  }
  return 'Hybrid';
}

function buildMappingEntry(appId, entry) {
  const businessId = entry.business;
  const templateKey = entry.templateKey;
  const business = getBusiness(businessId);
  const template = getTemplate(businessId, templateKey);
  const dltEnabled = entry.dltEnabled === true;
  const legacyRouteEnabled = isLegacyRouteEnabledForEntry(entry);
  const fallbackAllowed = legacyRouteEnabled;

  const templateDlt = template?.dlt ?? {};
  const dltMetadataComplete = Boolean(
    templateDlt.templateId && templateDlt.messageId && templateDlt.senderId && templateDlt.entityId,
  );
  const rolloutReady = dltEnabled && dltMetadataComplete;
  const activeDlt = config.otp.dltEnabled && dltEnabled;
  const deliveryPolicy = resolveDeliveryPolicy(activeDlt, fallbackAllowed);
  const retirementStatus = resolveRetirementStatus(activeDlt, fallbackAllowed);

  return {
    appId,
    businessId,
    templateKey,
    dltEnabled,
    legacyRouteEnabled,
    fallbackAllowed,
    dltMetadataComplete,
    rolloutReady,
    activeDlt,
    deliveryPolicy,
    retirementStatus,
    deliveryMode: activeDlt && !fallbackAllowed ? 'dlt_only' : (activeDlt ? 'dlt' : 'legacy_q'),
    templateId: templateDlt.templateId ?? null,
    messageId: templateDlt.messageId ?? null,
    senderId: templateDlt.senderId ?? null,
    entityId: templateDlt.entityId ?? null,
    businessExists: Boolean(business),
    templateExists: Boolean(template),
  };
}

function buildRetirementReadiness(stats, globalDltEnabled, credentialAppIds, mappedAppIds, retirement) {
  const unmappedCredentialApps = credentialAppIds.filter((id) => !mappedAppIds.includes(id));

  const configChecks = {
    allAppsDltEnabled: stats.legacyCount === 0 && stats.mappingCount > 0,
    globalDltEnabled,
    allMetadataComplete: stats.dltMetadataCompleteCount === stats.mappingCount && stats.mappingCount > 0,
    allCredentialAppsMapped: unmappedCredentialApps.length === 0,
    allRolloutReady: stats.rolloutReadyCount === stats.mappingCount && stats.mappingCount > 0,
    allActiveDlt: stats.activeDltCount === stats.mappingCount && stats.mappingCount > 0,
    allProductionAppsRetired: retirement.retiredApps === stats.dltEnabledCount
      && stats.dltEnabledCount > 0
      && retirement.hybridApps === 0,
  };

  const configReady = Object.values(configChecks).every(Boolean);

  const logChecksManual = [
    {
      id: 'dlt_success_rate_30d',
      label: '30-day DLT success rate ≥ 99.5%',
      verification: 'manual',
      description: 'Query logs: otp_delivery_completed where deliveryMode in (dlt, dlt_only) and status=completed',
    },
    {
      id: 'zero_fallback_30d',
      label: 'Zero otp_dlt_fallback events for retired apps (30 days)',
      verification: 'manual',
      description: 'Query logs: event=otp_dlt_fallback for retired appIds',
    },
    {
      id: 'zero_hard_failure_unresolved',
      label: 'No unresolved otp_dlt_hard_failure incidents',
      verification: 'manual',
      description: 'Review otp_dlt_hard_failure events and provider remediation',
    },
  ];

  return {
    configChecks,
    configReady,
    unmappedCredentialApps,
    logChecksManual,
    readyForRetirement: configReady,
    note: 'Phase 8D: DLT-only apps have legacyRouteEnabled=false. Hybrid apps retain route=q fallback.',
  };
}

function buildOtpHealthSnapshot() {
  const mappingsRaw = loadOtpMappingsFile();
  const appIds = Object.keys(mappingsRaw);
  const credentialAppIds = Object.keys(allowedApps);

  const mappings = appIds.map((appId) => buildMappingEntry(appId, mappingsRaw[appId]));
  const cutover = classifyCutoverApps(mappingsRaw);

  const dltEnabledCount = mappings.filter((m) => m.dltEnabled).length;
  const legacyCount = mappings.length - dltEnabledCount;
  const activeDltCount = mappings.filter((m) => m.activeDlt).length;
  const rolloutReadyCount = mappings.filter((m) => m.rolloutReady).length;
  const dltMetadataCompleteCount = mappings.filter((m) => m.dltMetadataComplete).length;
  const dltDeliveryPercent = mappings.length > 0
    ? Math.round((activeDltCount / mappings.length) * 100)
    : 0;

  const retirement = {
    retiredApps: cutover.retiredApps.length,
    hybridApps: cutover.hybridApps.length,
    legacyApps: cutover.legacyApps.length,
    retirementPercent: mappings.length > 0
      ? Math.round((cutover.retiredApps.length / mappings.length) * 100)
      : 0,
    retiredAppIds: cutover.retiredApps,
    hybridAppIds: cutover.hybridApps,
    legacyAppIds: cutover.legacyApps,
  };

  const stats = {
    mappingCount: mappings.length,
    dltEnabledCount,
    legacyCount,
    activeDltCount,
    rolloutReadyCount,
    dltMetadataCompleteCount,
    dltDeliveryPercent,
    credentialAppCount: credentialAppIds.length,
    dltOnlyCount: cutover.retiredApps.length,
    hybridCount: cutover.hybridApps.length,
  };

  const configHealth = {
    status: mappings.every((m) => m.businessExists && m.templateExists && m.dltMetadataComplete)
      ? 'healthy'
      : 'degraded',
    mappingsValid: true,
    businessRegistryHealthy: mappings.every((m) => m.businessExists),
    templatesValid: mappings.every((m) => m.templateExists),
    dltMetadataComplete: dltMetadataCompleteCount === mappings.length,
    startupValidation: 'passed',
  };

  const retirementReadiness = buildRetirementReadiness(
    stats,
    config.otp.dltEnabled,
    credentialAppIds,
    appIds,
    retirement,
  );

  return {
    generatedAt: new Date().toISOString(),
    globalDltEnabled: config.otp.dltEnabled,
    stats,
    mappings,
    configHealth,
    retirement,
    retirementReadiness,
    deliveryBreakdown: {
      dlt_only: cutover.retiredApps.length,
      hybrid: cutover.hybridApps.length,
      legacy_q: cutover.legacyApps.length,
    },
  };
}

function writeOtpHealthSnapshot(source = 'startup') {
  try {
    const snapshot = {
      ...buildOtpHealthSnapshot(),
      source,
    };

    fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

    logSystem('otp_config_health', 'completed', {}, {
      source,
      globalDltEnabled: snapshot.globalDltEnabled,
      mappingCount: snapshot.stats.mappingCount,
      activeDltCount: snapshot.stats.activeDltCount,
      configHealthStatus: snapshot.configHealth.status,
      retirementConfigReady: snapshot.retirementReadiness.configReady,
      retiredApps: snapshot.retirement.retiredApps,
      hybridApps: snapshot.retirement.hybridApps,
    });

    return snapshot;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'snapshot write failed';
    logSystem('otp_config_health', 'degraded', {}, { source, error: message });
    return null;
  }
}

function readOtpHealthSnapshot() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = {
  SNAPSHOT_PATH,
  buildOtpHealthSnapshot,
  writeOtpHealthSnapshot,
  readOtpHealthSnapshot,
};
