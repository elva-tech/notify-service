const { Router } = require('express');
const opsController = require('../controllers/ops.controller');

const router = Router();

router.get('/ops/logs', opsController.getLogs);
router.get('/ops/businesses', opsController.getBusinesses);

module.exports = router;
