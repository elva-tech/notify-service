const { Router } = require('express');
const { getHealth, headHealth } = require('../controllers/health.controller');

const otpRoutes = require('./otp.routes');

const router = Router();

router.get('/health', getHealth);
router.head('/health', headHealth);

router.use('/otp', otpRoutes);

module.exports = router;
