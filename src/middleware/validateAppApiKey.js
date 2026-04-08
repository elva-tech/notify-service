const { allowedApps } = require('../config/allowedApps');
const { normalizeAppId } = require('../utils/appId');

function unauthorized(res, message) {
  return res.status(401).json({
    success: false,
    error: 'unauthorized',
    message,
  });
}

function forbidden(res) {
  return res.status(403).json({
    success: false,
    error: 'forbidden',
    message: 'Invalid app credentials',
  });
}

/**
 * Requires appId and apiKey on the JSON body. Validates against {@link allowedApps}.
 */
function validateAppApiKey(req, res, next) {
  const body = req.body;
  const appId = body?.appId;
  const apiKey = body?.apiKey;

  if (appId === undefined || appId === null) {
    return unauthorized(res, 'appId is required');
  }
  if (typeof appId !== 'string') {
    return unauthorized(res, 'appId is required');
  }
  if (!appId.trim()) {
    return unauthorized(res, 'appId is required');
  }

  if (apiKey === undefined || apiKey === null) {
    return unauthorized(res, 'API key is required');
  }
  if (typeof apiKey !== 'string') {
    return unauthorized(res, 'API key is required');
  }
  if (!apiKey.trim()) {
    return unauthorized(res, 'API key is required');
  }

  let normalizedAppId;
  try {
    normalizedAppId = normalizeAppId(appId);
  } catch {
    return forbidden(res);
  }

  const expected = allowedApps[normalizedAppId];
  if (expected === undefined) {
    return forbidden(res);
  }

  if (expected !== apiKey.trim()) {
    return forbidden(res);
  }

  next();
}

module.exports = validateAppApiKey;
