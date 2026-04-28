const smsService = require('./sms/sms.service');
const emailService = require('./email/email.service');
const { getOtpTemplate } = require('./email/emailTemplates');
const { logInfo, logError } = require('../utils/logger');
const { SUPPORTED_CHANNELS } = require('../config/channels');

function normalizeChannel(channel) {
  if (typeof channel !== 'string' || !channel.trim()) {
    return 'SMS';
  }
  return channel.trim().toUpperCase();
}

async function handleSMS({ to, message, templateData }) {
  const recipients = Array.isArray(to) ? to : [to];

  if (typeof message === 'string' && message.trim()) {
    await Promise.all(recipients.map((recipient) => smsService.sendMessage(recipient, message)));
    return;
  }

  if (templateData?.otp) {
    await Promise.all(
      recipients.map((recipient) => smsService.sendOTP(recipient, templateData.otp, templateData.appId)),
    );
    return;
  }

  throw new Error('SMS message is required');
}

function buildTemplateHtml(subject, data) {
  return `<h2>${subject}</h2><p>${JSON.stringify(data ?? {})}</p>`;
}

async function handleEmail({
  to,
  subject,
  template,
  data,
  html,
  message,
  templateData,
}) {
  const resolvedSubject = subject?.trim() || 'Your ELVA OTP Code';

  let resolvedHtml;
  if (typeof html === 'string' && html.trim()) {
    resolvedHtml = html.trim();
  } else if (template !== undefined && template !== null) {
    resolvedHtml = buildTemplateHtml(resolvedSubject, data);
  } else if (templateData?.otp) {
    resolvedHtml = getOtpTemplate({
      otp: templateData.otp,
      appId: templateData.appId,
      fallbackMessage: message,
    });
  } else {
    throw new Error('Email body is required');
  }

  return emailService.sendEmail({ to, subject: resolvedSubject, html: resolvedHtml });
}

async function sendNotification({
  requestId,
  channel,
  to,
  subject,
  template,
  data,
  html,
  message,
  templateData,
}) {
  const normalizedChannel = normalizeChannel(channel);
  const recipientCount = Array.isArray(to) ? to.length : 1;
  const handlers = {
    EMAIL: handleEmail,
    SMS: handleSMS,
  };

  try {
    if (!SUPPORTED_CHANNELS.includes(normalizedChannel)) {
      throw new Error(`Unsupported notification channel: ${normalizedChannel}`);
    }

    await handlers[normalizedChannel]({
      to,
      subject,
      template,
      data,
      html,
      message,
      templateData,
    });

    logInfo('notification_sent', {
      requestId,
      channel: normalizedChannel,
      recipientCount,
    });
  } catch (err) {
    logError('notification_send_failed', {
      requestId,
      channel: normalizedChannel,
      recipientCount,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw err;
  }
}

module.exports = {
  sendNotification,
  normalizeChannel,
};
