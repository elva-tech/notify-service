const { normalizePhone } = require('../utils/phone');
const { normalizeEmail } = require('../utils/email');
const { normalizeAppId } = require('../utils/appId');
const otpService = require('../services/otp.service');
const otpCooldownService = require('../services/otpCooldown.service');
const notificationService = require('../services/notification.service');
const { logError } = require('../utils/logger');

function requireStringField(body, field) {
  if (body == null || typeof body !== 'object') {
    return { ok: false, field, message: `${field} is required` };
  }
  const value = body[field];
  if (value === undefined || value === null) {
    return { ok: false, field, message: `${field} is required` };
  }
  if (typeof value !== 'string') {
    return { ok: false, field, message: `${field} must be a string` };
  }
  if (!value.trim()) {
    return { ok: false, field, message: `${field} cannot be empty` };
  }
  return { ok: true };
}

/** @param {import('express').Response} res */
function validationError(req, res, message) {
  return res.status(400).json({
    success: false,
    error: 'validation_error',
    message,
    requestId: req.requestId,
  });
}

function resolveChannel(rawChannel) {
  if (rawChannel === undefined || rawChannel === null || rawChannel === '') {
    return 'SMS';
  }
  if (typeof rawChannel !== 'string') {
    throw new Error('channel must be a string');
  }
  const channel = rawChannel.trim().toUpperCase();
  if (!channel) {
    return 'SMS';
  }
  if (channel !== 'SMS' && channel !== 'EMAIL') {
    throw new Error('channel must be either SMS or EMAIL');
  }
  return channel;
}

/**
 * Shared validation for send / resend OTP (phone, appId, normalization).
 * @returns {boolean} true if valid; otherwise sends error response and returns false.
 */
function assertSendOtpBodyValid(req, res) {
  const appCheck = requireStringField(req.body, 'appId');
  if (!appCheck.ok) {
    validationError(req, res, appCheck.message);
    return false;
  }

  try {
    req.notificationChannel = resolveChannel(req.body?.channel);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid channel';
    validationError(req, res, message);
    return false;
  }

  if (req.notificationChannel === 'EMAIL') {
    const emailCheck = requireStringField(req.body, 'email');
    if (!emailCheck.ok) {
      validationError(req, res, emailCheck.message);
      return false;
    }

    try {
      req.notificationTarget = normalizeEmail(req.body.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email address';
      validationError(req, res, message);
      return false;
    }
  } else {
    const phoneCheck = requireStringField(req.body, 'phone');
    if (!phoneCheck.ok) {
      validationError(req, res, phoneCheck.message);
      return false;
    }

    try {
      req.notificationTarget = normalizePhone(req.body.phone);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid phone number';
      validationError(req, res, message);
      return false;
    }
  }

  try {
    normalizeAppId(req.body.appId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid app id';
    validationError(req, res, message);
    return false;
  }

  return true;
}

const verifyReasonHttp = {
  invalid_input: { status: 400, message: 'Invalid request' },
  invalid_phone: { status: 400, message: 'Invalid phone number' },
  invalid_contact: { status: 400, message: 'Invalid phone number or email' },
  invalid_app_id: { status: 400, message: 'Invalid app id' },
  invalid_otp_format: { status: 400, message: 'OTP must be exactly 6 digits' },
  not_found: { status: 404, message: 'No active OTP for this contact. Request a new code.' },
  expired: { status: 410, message: 'OTP has expired. Request a new code.' },
  max_attempts: { status: 429, message: 'Too many failed attempts. Request a new code.' },
  mismatch: { status: 401, message: 'Invalid OTP' },
};

/**
 * Generate OTP, send SMS, respond (shared by sendOtp and resendOtp).
 * Expects body already validated via {@link assertSendOtpBodyValid}.
 */
async function sendOtpImpl(req, res, next) {
  try {
    const { appId } = req.body;
    const channel = req.notificationChannel || 'SMS';
    const to = req.notificationTarget;

    const { otp, expiresInSeconds } = await otpService.generateOTP(
      to,
      appId,
    );

    try {
      await notificationService.sendNotification({
        requestId: req.requestId,
        channel,
        to,
        subject: 'Your ELVA OTP Code',
        templateData: { otp, appId },
      });
    } catch (smsErr) {
      logError('otp_notification_send_failed', {
        requestId: req.requestId,
        channel,
        error: smsErr instanceof Error ? smsErr.message : 'Unknown error',
      });
      await otpService.revokeOTP(to, appId);
      return res.status(502).json({
        success: false,
        error: 'sms_failed',
        message: 'Failed to send OTP. Please try again.',
        requestId: req.requestId,
      });
    }

    if (channel === 'SMS') {
      await otpCooldownService.applyAfterSuccessfulSend(to, appId);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: expiresInSeconds,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

async function sendOtp(req, res, next) {
  try {
    if (!assertSendOtpBodyValid(req, res)) {
      return;
    }
    await sendOtpImpl(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    if (!assertSendOtpBodyValid(req, res)) {
      return;
    }

    const { appId } = req.body;
    const to = req.notificationTarget;
    await otpService.revokeOTP(to, appId);
    await sendOtpImpl(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const appCheck = requireStringField(req.body, 'appId');
    if (!appCheck.ok) {
      return validationError(req, res, appCheck.message);
    }

    const otpCheck = requireStringField(req.body, 'otp');
    if (!otpCheck.ok) {
      return validationError(req, res, otpCheck.message);
    }

    const phone = req.body?.phone;
    const email = req.body?.email;
    if ((phone == null || phone === '') && (email == null || email === '')) {
      return validationError(req, res, 'phone or email is required');
    }

    let target;
    if (email != null && email !== '') {
      try {
        target = normalizeEmail(email);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid email address';
        return validationError(req, res, message);
      }
    } else {
      try {
        target = normalizePhone(phone);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid phone number';
        return validationError(req, res, message);
      }
    }

    const { appId, otp } = req.body;

    const result = await otpService.verifyOTP(target, otp, appId);

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        requestId: req.requestId,
      });
    }

    const mapped = verifyReasonHttp[result.reason] ?? {
      status: 400,
      message: 'Verification failed',
    };

    return res.status(mapped.status).json({
      success: false,
      error: result.reason,
      message: mapped.message,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendOtp,
  resendOtp,
  verifyOtp,
};
