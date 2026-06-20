const config = require('../config/env');

function extractOpsToken(req) {
  const headerToken = req.get('x-ops-admin-token');
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }

  const auth = req.get('authorization');
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  return null;
}

function requireOpsAdmin(req, res, next) {
  const expected = config.integrations.opsAdminToken?.trim();
  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'admin_not_configured',
      message: 'Ops admin token is not configured on the server',
      requestId: req.requestId,
    });
  }

  const provided = extractOpsToken(req);
  if (!provided || provided !== expected) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Valid ops admin token is required',
      requestId: req.requestId,
    });
  }

  next();
}

module.exports = {
  requireOpsAdmin,
};
