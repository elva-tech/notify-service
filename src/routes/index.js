const { Router } = require('express');
const healthRoutes = require('./health.routes');
const otpRoutes = require('./otp.routes');
const notifyRoutes = require('./notify.routes');

const router = Router();

router.use(healthRoutes);
router.use(otpRoutes);
router.use(notifyRoutes);

module.exports = router;
