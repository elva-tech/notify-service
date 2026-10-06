const DEFAULT_LOCAL_PLATFORM_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_PLATFORM_URL = 'https://notify.elvatech.in';

function isLocalhostPlatformUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/**
 * Base URL for links in onboarding / credential emails (docs, status, approvals).
 * @param {{ platformPublicUrl?: string | null, nodeEnv?: string }} [options]
 */
function resolvePublicPlatformUrl(options = {}) {
  const rawEnv = options.platformPublicUrl ?? process.env.PLATFORM_PUBLIC_URL;
  const nodeEnv = (options.nodeEnv ?? process.env.NODE_ENV ?? 'development').trim() || 'development';
  const raw = typeof rawEnv === 'string' ? rawEnv.trim() : '';

  if (raw) {
    const normalized = raw.replace(/\/$/, '');
    if (nodeEnv === 'production' && isLocalhostPlatformUrl(normalized)) {
      return DEFAULT_PRODUCTION_PLATFORM_URL;
    }
    return normalized;
  }

  if (nodeEnv === 'production') {
    return DEFAULT_PRODUCTION_PLATFORM_URL;
  }

  return DEFAULT_LOCAL_PLATFORM_URL;
}

module.exports = {
  resolvePublicPlatformUrl,
  isLocalhostPlatformUrl,
  DEFAULT_LOCAL_PLATFORM_URL,
  DEFAULT_PRODUCTION_PLATFORM_URL,
};
