const { normalizePhone } = require('../utils/phone');
const { normalizeAppId } = require('../utils/appId');
const otpService = require('../services/otp.service');
const smsService = require('../services/sms/sms.service');

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

async function sendOtp(req, res, next) {
  try {
    const check = requireStringField(req.body, 'phone');
    if (!check.ok) {
      return validationError(res, check.message);
    }

    const appCheck = requireStringField(req.body, 'appId');
    if (!appCheck.ok) {
      return validationError(res, appCheck.message);
    }

    try {
      normalizePhone(req.body.phone);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid phone number';
      return validationError(res, message);
    }

    try {
      normalizeAppId(req.body.appId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid app id';
      return validationError(res, message);
    }

    const { phone, appId } = req.body;

    const { otp, expiresAt, expiresInSeconds } = await otpService.generateOTP(
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

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt,
      expiresInSeconds,
    });
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

module.exports = {
  sendOtp,
  verifyOtp,
};
