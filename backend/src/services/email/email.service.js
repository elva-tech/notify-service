const sgMail = require('@sendgrid/mail');
const config = require('../../config/env');

let initializedApiKey = null;

function ensureSendgridConfigured() {
  const apiKey = config.sendgrid.apiKey?.trim();
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not set');
  }
  if (initializedApiKey !== apiKey) {
    sgMail.setApiKey(apiKey);
    initializedApiKey = apiKey;
  }
}

function normalizeRecipients(to) {
  if (Array.isArray(to)) {
    const recipients = to
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
    if (recipients.length === 0) {
      throw new Error('At least one recipient email is required');
    }
    return recipients;
  }

  if (typeof to === 'string' && to.trim()) {
    return [to.trim()];
  }

  throw new Error('Recipient email is required');
}

async function sendEmail({ to, subject, html }) {
  ensureSendgridConfigured();

  const from = config.email.from?.trim();
  if (!from) {
    throw new Error('EMAIL_FROM is not set');
  }

  const recipients = normalizeRecipients(to);

  return sgMail.send({
    to: recipients,
    from,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
};
