const logBuffer = require('../services/logBuffer.service');
const { listBusinesses } = require('../businesses');

function getLogs(req, res) {
  const { business, limit, since, format } = req.query;

  const logs = logBuffer.getLogs({
    business: typeof business === 'string' ? business : undefined,
    limit: limit != null ? Number(limit) : 100,
    since: typeof since === 'string' ? since : undefined,
  });

  if (format === 'raw' || format === 'ndjson') {
    const body = logs.map((entry) => JSON.stringify(entry)).join('\n');
    res.type('text/plain; charset=utf-8');
    return res.send(body ? `${body}\n` : '');
  }

  res.json({
    success: true,
    business: typeof business === 'string' && business.trim() ? business.trim() : null,
    count: logs.length,
    logs,
    businesses: listBusinesses(),
    businessesWithLogs: logBuffer.listBusinessesWithLogs(),
    requestId: req.requestId,
  });
}

function getBusinesses(req, res) {
  res.json({
    success: true,
    businesses: listBusinesses(),
    businessesWithLogs: logBuffer.listBusinessesWithLogs(),
    requestId: req.requestId,
  });
}

module.exports = {
  getLogs,
  getBusinesses,
};
