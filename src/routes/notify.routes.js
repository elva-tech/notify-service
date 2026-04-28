const { Router } = require('express');
const validateAppApiKey = require('../middleware/validateAppApiKey');
const { handleNotify } = require('../controllers/notify.controller');

const router = Router();

router.post('/notify', validateAppApiKey, handleNotify);

module.exports = router;
