const config = require('../config/env');
const { getPlatformCredentials } = require('../config/allowedApps');
const { sendEmail } = require('./email/email.service');
const { logSystem } = require('./logging/businessLogger.service');

function platformBaseUrl() {
  return (config.integrations.publicPlatformUrl || 'http://localhost:3000').replace(/\/$/, '');
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

function formatTemplateList(templates) {
  const otp = (templates?.otp ?? []).join(', ') || 'none';
  const notify = (templates?.notify ?? []).join(', ') || 'none';
  return { otp, notify };
}

async function sendEmailSafe({ to, subject, html, event }) {
  if (!config.sendgrid.apiKey?.trim() || !config.email.from?.trim()) {
    logSystem(event, 'skipped', {}, { reason: 'email_not_configured' });
    return false;
  }

  try {
    await sendEmail({ to, subject, html });
    logSystem(event, 'completed', {}, { to });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'email_failed';
    logSystem(event, 'failed', {}, { to, message });
    return false;
  }
}

async function notifyAdminNewRequest(request) {
  const adminEmail = config.integrations.adminNotifyEmail;
  if (!adminEmail) {
    logSystem('brand_request_admin_email', 'skipped', {}, { reason: 'admin_email_not_configured' });
    return false;
  }

  const approvalsUrl = `${platformBaseUrl()}/platform/approvals`;
  const statusUrl = `${platformBaseUrl()}/onboard/status/${encodeURIComponent(request.id)}`;
  const submitter = request.submittedBy ?? {};
  const { otp, notify } = formatTemplateList(request.templates);

  const html = emailShell(`
    <h2>New ELVA Notify integration request</h2>
    <p><strong>Request ID:</strong> ${escapeHtml(request.id)}</p>
    <p><strong>Brand:</strong> ${escapeHtml(request.brandName)} (<code>${escapeHtml(request.brandId)}</code>)</p>
    <p><strong>Team:</strong> ${escapeHtml(submitter.team ?? '')}</p>
    <p><strong>Contact:</strong> ${escapeHtml(submitter.name ?? '')} &lt;${escapeHtml(submitter.email ?? '')}&gt;</p>
    <p><strong>OTP templates:</strong> ${escapeHtml(otp)}</p>
    <p><strong>Notify templates:</strong> ${escapeHtml(notify)}</p>
    ${submitter.notes ? `<p><strong>Notes:</strong> ${escapeHtml(submitter.notes)}</p>` : ''}
    <p>${emailLink(approvalsUrl, 'Review in approvals portal')}</p>
    <p>${emailLink(statusUrl, 'View public status page')}</p>
  `);

  return sendEmailSafe({
    to: adminEmail,
    subject: `[ELVA Notify] New integration request — ${request.brandName} (${request.id})`,
    html,
    event: 'brand_request_admin_email',
  });
}

async function notifyRequesterSubmitted(request) {
  const email = request.submittedBy?.email;
  if (!email) return false;

  const statusUrl = `${platformBaseUrl()}/onboard/status/${encodeURIComponent(request.id)}`;
  const submitter = request.submittedBy ?? {};
  const { otp, notify } = formatTemplateList(request.templates);

  const html = emailShell(`
    <h2>Your ELVA Notify integration request was received</h2>
    <p>Hi ${escapeHtml(submitter.name ?? 'there')},</p>
    <p>
      We received your request for brand <strong>${escapeHtml(request.brandName)}</strong>
      (<code>${escapeHtml(request.brandId)}</code>). It is <strong>pending approval</strong> from the ELVA team.
    </p>
    <p><strong>Request ID:</strong> ${escapeHtml(request.id)}</p>
    <p><strong>OTP templates requested:</strong> ${escapeHtml(otp)}</p>
    <p><strong>Notify templates requested:</strong> ${escapeHtml(notify)}</p>
    <p>You can track progress anytime on your status page:</p>
    <p>${emailLink(statusUrl, 'View your request status')}</p>
    <p>We will email you again once ELVA reviews your request. API credentials are issued after approval.</p>
  `);

  return sendEmailSafe({
    to: email,
    subject: `[ELVA Notify] Request submitted — ${request.brandName}`,
    html,
    event: 'brand_request_submitted_email',
  });
}

async function notifyRequesterApproved(request) {
  const email = request.submittedBy?.email;
  if (!email) return false;

  const docsUrl = `${platformBaseUrl()}/docs/api/authentication`;
  const statusUrl = `${platformBaseUrl()}/onboard/status/${encodeURIComponent(request.id)}`;
  const credentials = getPlatformCredentials();
  const { otp, notify } = formatTemplateList(request.templates);

  const credentialsBlock = credentials
    ? `
    <p>Based on your approved templates, the ELVA team has issued your integration credentials:</p>
    <ul>
      <li><strong>appId:</strong> <code>${escapeHtml(credentials.appId)}</code></li>
      <li><strong>apiKey:</strong> <code>${escapeHtml(credentials.apiKey)}</code></li>
      <li><strong>brandId:</strong> <code>${escapeHtml(request.brandId)}</code></li>
    </ul>
    <p>Include <code>appId</code>, <code>apiKey</code>, and <code>brandId</code> on OTP and SMS notify API calls.</p>
  `
    : `
    <p>Your brand is active. The ELVA team will share your <code>appId</code> and <code>apiKey</code> separately.</p>
    <p>Include <code>brandId: "${escapeHtml(request.brandId)}"</code> on every OTP call and in notify SMS requests.</p>
  `;

  const html = emailShell(`
    <h2>Your ELVA Notify integration was approved</h2>
    <p>Hi ${escapeHtml(request.submittedBy?.name ?? 'there')},</p>
    <p>
      Brand <strong>${escapeHtml(request.brandName)}</strong> (<code>${escapeHtml(request.brandId)}</code>) is now active.
    </p>
    <p><strong>Approved OTP templates:</strong> ${escapeHtml(otp)}</p>
    <p><strong>Approved notify templates:</strong> ${escapeHtml(notify)}</p>
    ${credentialsBlock}
    <p>${emailLink(docsUrl, 'Read the authentication guide')}</p>
    <p>${emailLink(statusUrl, 'View your request status')}</p>
  `);

  return sendEmailSafe({
    to: email,
    subject: `[ELVA Notify] Approved — ${request.brandName}`,
    html,
    event: 'brand_request_approved_email',
  });
}

async function notifyRequesterRejected(request) {
  const email = request.submittedBy?.email;
  if (!email) return false;

  const onboardUrl = `${platformBaseUrl()}/onboard`;
  const html = emailShell(`
    <h2>Your ELVA Notify integration request was not approved</h2>
    <p>Brand <strong>${escapeHtml(request.brandName)}</strong> (<code>${escapeHtml(request.brandId)}</code>)</p>
    <p><strong>Reason:</strong> ${escapeHtml(request.rejectionReason ?? 'No reason provided')}</p>
    <p>You may submit a revised request from the ${emailLink(onboardUrl, 'onboarding form')}.</p>
  `);

  return sendEmailSafe({
    to: email,
    subject: `[ELVA Notify] Request declined — ${request.brandName}`,
    html,
    event: 'brand_request_rejected_email',
  });
}

module.exports = {
  notifyAdminNewRequest,
  notifyRequesterSubmitted,
  notifyRequesterApproved,
  notifyRequesterRejected,
};
