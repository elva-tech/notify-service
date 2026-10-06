/**
 * Shared portal base URL + HTML helpers for ops/onboarding transactional emails.
 * Uses config.integrations.publicPlatformUrl (dev localhost, prod notify.elvatech.in).
 */

const config = require('../../config/env');

function getPlatformBaseUrl() {
  return config.integrations.publicPlatformUrl;
}

/**
 * @param {string} relativePath - path beginning with /
 * @param {string} [baseUrl] - override for tests
 */
function buildPlatformUrl(relativePath, baseUrl) {
  const base = (baseUrl ?? getPlatformBaseUrl()).replace(/\/$/, '');
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailLink(href, label) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeHref}" style="color:#2563eb;text-decoration:underline;">${safeLabel}</a>`;
}

function emailShell(innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#18181b;">
${innerHtml}
</body>
</html>`;
}

/** Relative portal paths used in transactional email links (audit list). */
const PLATFORM_EMAIL_PATHS = {
  docsAuthentication: '/docs/api/authentication',
  onboard: '/onboard',
  onboardStatus: (requestId) => `/onboard/status/${encodeURIComponent(requestId)}`,
  platformApprovals: '/platform/approvals',
  platformDashboard: '/platform',
  platformNotify: '/platform/notify',
  platformBusinesses: '/platform/businesses',
  playground: '/playground',
};

module.exports = {
  getPlatformBaseUrl,
  buildPlatformUrl,
  escapeHtml,
  emailLink,
  emailShell,
  PLATFORM_EMAIL_PATHS,
};
