require('./env');

/**
 * In-memory map of appId → api secret, loaded once at startup from env.
 * Example APP_CREDENTIALS_JSON: {"ABC":"secret_abc_123","XYZ":"secret_xyz_456"}
 */
function loadAllowedApps() {
  const raw = process.env.APP_CREDENTIALS_JSON;
  if (raw == null || !String(raw).trim()) {
    return Object.create(null);
  }

  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'parse error';
    throw new Error(`Invalid APP_CREDENTIALS_JSON: ${msg}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('APP_CREDENTIALS_JSON must be a JSON object mapping appId to apiKey');
  }

  const map = Object.create(null);
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`APP_CREDENTIALS_JSON: value for "${key}" must be a string`);
    }
    const id = String(key).trim();
    if (!id) {
      throw new Error('APP_CREDENTIALS_JSON: appId keys must be non-empty');
    }
    map[id] = value;
  }
  return map;
}

const allowedApps = loadAllowedApps();

module.exports = {
  allowedApps,
};
