const { normalizePhone } = require('../utils/phone');
const { normalizeAppId } = require('../utils/appId');
const otpService = require('../services/otp.service');
const otpCooldownService = require('../services/otpCooldown.service');
const smsService = require('../services/sms/sms.service');
const fast2sms = require('../services/sms/providers/fast2sms');

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
function validationError(res, message) {
  return res.status(400).json({
    success: false,
    error: 'validation_error',
    message,
  });
}

/**
 * Shared validation for send / resend OTP (phone, appId, normalization).
 * @returns {boolean} true if valid; otherwise sends error response and returns false.
 */
function assertSendOtpBodyValid(req, res) {
  const check = requireStringField(req.body, 'phone');
  if (!check.ok) {
    validationError(res, check.message);
    return false;
  }

  const appCheck = requireStringField(req.body, 'appId');
  if (!appCheck.ok) {
    validationError(res, appCheck.message);
    return false;
  }

  try {
    normalizePhone(req.body.phone);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid phone number';
    validationError(res, message);
    return false;
  }

  try {
    normalizeAppId(req.body.appId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid app id';
    validationError(res, message);
    return false;
  }

  return true;
}

const verifyReasonHttp = {
  invalid_input: { status: 400, message: 'Invalid request' },
  invalid_phone: { status: 400, message: 'Invalid phone number' },
  invalid_app_id: { status: 400, message: 'Invalid app id' },
  invalid_otp_format: { status: 400, message: 'OTP must be exactly 6 digits' },
  not_found: { status: 404, message: 'No active OTP for this number. Request a new code.' },
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
    const { phone, appId } = req.body;

    const { otp, expiresInSeconds } = await otpService.generateOTP(
      phone,
      appId,
    );

    try {
      await smsService.sendOTP(phone, otp, appId);
    } catch (smsErr) {
      console.error('SMS send failed', smsErr);
      await otpService.revokeOTP(phone, appId);
      return res.status(502).json({
        success: false,
        error: 'sms_failed',
        message: 'Failed to send OTP. Please try again.',
      });
    }

    await otpCooldownService.applyAfterSuccessfulSend(phone, appId);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: expiresInSeconds,
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

    const { phone, appId } = req.body;
    await otpService.revokeOTP(phone, appId);
    await sendOtpImpl(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const phoneCheck = requireStringField(req.body, 'phone');
    if (!phoneCheck.ok) {
      return validationError(res, phoneCheck.message);
    }

    const appCheck = requireStringField(req.body, 'appId');
    if (!appCheck.ok) {
      return validationError(res, appCheck.message);
    }

    const otpCheck = requireStringField(req.body, 'otp');
    if (!otpCheck.ok) {
      return validationError(res, otpCheck.message);
    }

    const { phone, appId, otp } = req.body;

    const result = await otpService.verifyOTP(phone, otp, appId);

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
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
    });
  } catch (err) {
    next(err);
  }
}

async function notifySend(req, res) {
  const { phone, message } = req.body;

  if (!phone || !message) {

    return res.status(400).json({
      success: false,
      error: 'Request body must include phone and message'
    });
  }
  const normalized = normalizePhone(phone);
  try {
  await fast2sms.sendSMS(normalized, message);
  return res.status(200).json({
    success: true,
    data: { phone, message },
    message: 'Notification processed'
  });
  } catch (err) {
    console.log('SMS send failed', err);
    return res.status(502).json({
      success: false,
      error: 'sms_failed',
      message: 'Failed to send notification. Please try again.'
    });
  }
}

module.exports = {
  sendOtp,
  resendOtp,
  verifyOtp,
  notifySend
};
