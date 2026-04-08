const { Router } = require('express');
const { sendOtp, verifyOtp } = require('../controllers/otp.controller');

const router = Router();

router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

module.exports = router;
