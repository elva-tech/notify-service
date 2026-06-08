const { readOtpHealthSnapshot } = require('../services/otpHealthSnapshot.service');

function buildHealthPayload(req) {
  const response = {
    status: 'ok',
    service: 'elva-otp-service',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  const snapshot = readOtpHealthSnapshot();
  if (snapshot) {
    response.otpDlt = {
      globalDltEnabled: snapshot.globalDltEnabled,
      mappingCount: snapshot.stats?.mappingCount ?? 0,
      activeDltCount: snapshot.stats?.activeDltCount ?? 0,
      retiredApps: snapshot.retirement?.retiredApps ?? 0,
      hybridApps: snapshot.retirement?.hybridApps ?? 0,
      retirementPercent: snapshot.retirement?.retirementPercent ?? 0,
      configHealthStatus: snapshot.configHealth?.status ?? 'unknown',
      retirementConfigReady: snapshot.retirementReadiness?.configReady ?? false,
      snapshotGeneratedAt: snapshot.generatedAt,
    };
  }

  return response;
}

function getHealth(req, res) {
  res.status(200).json(buildHealthPayload(req));
}

/** Lightweight probe for Render / UptimeRobot (no response body). */
function headHealth(req, res) {
  res.status(200).end();
}

module.exports = { getHealth, headHealth, buildHealthPayload };
