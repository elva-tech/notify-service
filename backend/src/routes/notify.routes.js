const { Router } = require('express');
const validateAppApiKey = require('../middleware/validateAppApiKey');
const { validateApprovedBrandForNotify } = require('../middleware/validateApprovedBrand');
const { handleNotify } = require('../controllers/notify.controller');

const router = Router();

router.post('/notify', validateAppApiKey, validateApprovedBrandForNotify, handleNotify);

module.exports = router;
