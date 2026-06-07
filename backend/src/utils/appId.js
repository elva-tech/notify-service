function normalizeAppId(appId) {
  if (typeof appId !== 'string') {
    throw new TypeError('appId must be a string');
  }
  const trimmed = appId.trim();
  if (!trimmed) {
    throw new Error('appId cannot be empty');
  }
  if (trimmed.includes(':')) {
    throw new Error('appId cannot contain ":"');
  }
  return trimmed;
}

module.exports = { normalizeAppId };
