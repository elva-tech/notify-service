const { Router } = require('express');
const healthRoutes = require('./health.routes');
const otpRoutes = require('./otp.routes');

const router = Router();

router.use(healthRoutes);
router.use(otpRoutes);

module.exports = router;
