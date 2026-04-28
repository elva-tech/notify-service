const notificationService = require('../services/notification.service');
const { logError } = require('../utils/logger');
const { SUPPORTED_CHANNELS } = require('../config/channels');

function validationError(req, res, message) {
  return res.status(400).json({
    success: false,
    error: 'validation_error',
    message,
    requestId: req.requestId,
  });
}

function invalidChannelError(req, res) {
  return res.status(400).json({
    success: false,
    error: 'invalid_channel',
    message: `channel must be one of: ${SUPPORTED_CHANNELS.join(', ')}`,
    requestId: req.requestId,
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeErrorMessage(message, fallback = 'Failed to send notification') {
  if (typeof message !== 'string' || !message.trim()) {
    return fallback;
  }

  const trimmed = message.trim();
  const hasSecretLikeToken = /(api[_-]?key|authorization|bearer|token|password|secret)/i.test(trimmed);
  const hasStackTrace = /\bat\s+.+\(.+\)/.test(trimmed) || trimmed.includes('\n');
  if (hasSecretLikeToken || hasStackTrace) {
    return fallback;
  }

  return trimmed;
}

function resolveClientErrorMessage(err) {
  const causeMessage = err?.cause?.message;
  if (typeof causeMessage === 'string' && causeMessage.trim()) {
    return sanitizeErrorMessage(causeMessage);
  }

  const errorMessage = err?.message;
  if (typeof errorMessage === 'string' && errorMessage.trim()) {
    return sanitizeErrorMessage(errorMessage);
  }

  return 'Failed to send notification';
}

function validateRecipients(to) {
  if (!Array.isArray(to)) {
    return 'to must be an array with at least one value';
  }
  if (to.length === 0) {
    return 'to must be an array with at least one value';
  }
  const allValid = to.every((entry) => isNonEmptyString(entry));
  if (!allValid) {
    return 'to must contain non-empty string values';
  }
  return null;
}

async function handleNotify(req, res) {
  const {
    channel,
    to,
    subject,
    template,
    data,
    html,
    message,
  } = req.body || {};

  if (!isNonEmptyString(channel)) {
    return validationError(req, res, 'channel is required');
  }

  const toError = validateRecipients(to);
  if (toError) {
    return validationError(req, res, toError);
  }

  const normalizedChannel = channel.trim().toUpperCase();

  if (!SUPPORTED_CHANNELS.includes(normalizedChannel)) {
    return invalidChannelError(req, res);
  }

  if (normalizedChannel === 'EMAIL') {
    if (!isNonEmptyString(subject)) {
      return validationError(req, res, 'subject is required for EMAIL channel');
    }

    const hasTemplate = template !== undefined && template !== null;
    const hasHtml = html !== undefined && html !== null;

    if (hasTemplate && hasHtml) {
      return validationError(req, res, 'Provide either template or html, not both');
    }
    if (!hasTemplate && !hasHtml) {
      return validationError(req, res, 'Either template or html is required for EMAIL channel');
    }

    if (hasTemplate && !isNonEmptyString(template)) {
      return validationError(req, res, 'template must be a non-empty string');
    }
    if (hasHtml && !isNonEmptyString(html)) {
      return validationError(req, res, 'html must be a non-empty string');
    }
    if (data !== undefined && data !== null && (typeof data !== 'object' || Array.isArray(data))) {
      return validationError(req, res, 'data must be an object when provided');
    }
  } else if (normalizedChannel === 'SMS') {
    if (!isNonEmptyString(message)) {
      return validationError(req, res, 'message is required for SMS channel');
    }
  }

  try {
    await notificationService.sendNotification({
      ...req.body,
      requestId: req.requestId,
    });
    return res.status(200).json({
      success: true,
      message: 'Notification sent',
      channel: normalizedChannel,
      requestId: req.requestId,
    });
  } catch (err) {
    const clientMessage = resolveClientErrorMessage(err);
    logError('notification_failed', {
      requestId: req.requestId,
      channel: normalizedChannel,
      error: err instanceof Error ? err.message : 'Unknown error',
      cause: err?.cause,
    });
    return res.status(500).json({
      success: false,
      error: 'notification_failed',
      message: clientMessage,
      channel: normalizedChannel,
      requestId: req.requestId,
    });
  }
}

module.exports = {
  handleNotify,
};
