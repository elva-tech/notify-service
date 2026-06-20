const { Router } = require('express');
const platformController = require('../controllers/platform.controller');

const router = Router();

router.get('/platform/businesses', platformController.listBusinessesHandler);
router.get('/platform/businesses/:businessId', platformController.getBusinessHandler);
router.get('/platform/businesses/:businessId/templates', platformController.listTemplatesHandler);
router.get(
  '/platform/businesses/:businessId/templates/:templateKey',
  platformController.getTemplateHandler,
);
router.get('/platform/otp', platformController.getOtpMetadataHandler);
router.get('/platform/brands', platformController.listBrandsHandler);

module.exports = router;
