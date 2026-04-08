const { Router } = require('express');
const { sendOtp, verifyOtp } = require('../controllers/otp.controller');
const validateAppApiKey = require('../middleware/validateAppApiKey');
const rateLimitOtpSend = require('../middleware/rateLimitOtpSend');

const router = Router();

router.post('/otp/send', validateAppApiKey, rateLimitOtpSend, sendOtp);
router.post('/otp/verify', validateAppApiKey, verifyOtp);

module.exports = router;
