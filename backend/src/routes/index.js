const { Router } = require('express');
const healthRoutes = require('./health.routes');
const otpRoutes = require('./otp.routes');
const notifyRoutes = require('./notify.routes');
const opsRoutes = require('./ops.routes');
const platformRoutes = require('./platform.routes');

const router = Router();

router.use(healthRoutes);
router.use(otpRoutes);
router.use(notifyRoutes);
router.use(opsRoutes);
router.use(platformRoutes);

module.exports = router;
