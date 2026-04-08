const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller');

const otpRoutes = require('./otp.routes');

const router = Router();

router.get('/health', getHealth);

router.use('/otp', otpRoutes);

module.exports = router;
