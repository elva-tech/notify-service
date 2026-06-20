/**
 * Business Foundation
 * -------------------
 * Loads business modules from backend/config/businesses/ at startup.
 * New businesses are onboarded by adding a configuration folder only.
 */

const registry = require('./registry');
const { loadBusinessConfigurations } = require('./configLoader');
const { validateOtpMappingsAtStartup } = require('../services/otpMappingValidator.service');
const { validateBrandRegistryAtStartup } = require('../services/brandRegistry.service');
const { writeOtpHealthSnapshot } = require('../services/otpHealthSnapshot.service');
const { writeBusinessHealthSnapshot } = require('../services/businessConfigAudit.service');

loadBusinessConfigurations();
validateBrandRegistryAtStartup();
validateOtpMappingsAtStartup();
writeOtpHealthSnapshot('startup');
writeBusinessHealthSnapshot('startup');

module.exports = {
  registerBusiness: registry.registerBusiness,
  getBusiness: registry.getBusiness,
  listBusinesses: registry.listBusinesses,
  getTemplate: registry.getTemplate,
  listTemplates: registry.listTemplates,
};
