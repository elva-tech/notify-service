const { Router } = require('express');
const { sendOtp, resendOtp, verifyOtp, notifySend } = require('../controllers/otp.controller');
const validateAppApiKey = require('../middleware/validateAppApiKey');
const checkOtpSendCooldown = require('../middleware/checkOtpSendCooldown');
const rateLimitOtpSend = require('../middleware/rateLimitOtpSend');

const router = Router();

router.post('/send', validateAppApiKey, checkOtpSendCooldown, rateLimitOtpSend, sendOtp);
router.post('/resend', validateAppApiKey, checkOtpSendCooldown, rateLimitOtpSend, resendOtp);
router.post('/verify', validateAppApiKey, verifyOtp);
router.post('/notify/send', notifySend);

module.exports = router;
