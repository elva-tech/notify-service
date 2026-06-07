const {
  listPlatformBusinesses,
  getPlatformBusiness,
  listPlatformTemplates,
  getPlatformTemplate,
  getPlatformOtpMetadata,
} = require('../services/platformMetadata.service');

function listBusinessesHandler(req, res) {
  const payload = listPlatformBusinesses();
  res.status(200).json({
    success: true,
    requestId: req.requestId,
    ...payload,
  });
}

function getBusinessHandler(req, res) {
  const business = getPlatformBusiness(req.params.businessId);
  if (!business) {
    return res.status(404).json({
      success: false,
      error: 'not_found',
      message: `Business not found: ${req.params.businessId}`,
      requestId: req.requestId,
    });
  }

  return res.status(200).json({
    success: true,
    requestId: req.requestId,
    business,
  });
}

function listTemplatesHandler(req, res) {
  const payload = listPlatformTemplates(req.params.businessId);
  if (!payload) {
    return res.status(404).json({
      success: false,
      error: 'not_found',
      message: `Business not found: ${req.params.businessId}`,
      requestId: req.requestId,
    });
  }

  return res.status(200).json({
    success: true,
    requestId: req.requestId,
    ...payload,
  });
}

function getTemplateHandler(req, res) {
  const payload = getPlatformTemplate(req.params.businessId, req.params.templateKey);
  if (!payload) {
    return res.status(404).json({
      success: false,
      error: 'not_found',
      message: `Template not found: ${req.params.businessId}/${req.params.templateKey}`,
      requestId: req.requestId,
    });
  }

  return res.status(200).json({
    success: true,
    requestId: req.requestId,
    ...payload,
  });
}

function getOtpMetadataHandler(req, res) {
  const payload = getPlatformOtpMetadata();
  res.status(200).json({
    success: true,
    requestId: req.requestId,
    ...payload,
  });
}

module.exports = {
  listBusinessesHandler,
  getBusinessHandler,
  listTemplatesHandler,
  getTemplateHandler,
  getOtpMetadataHandler,
};
