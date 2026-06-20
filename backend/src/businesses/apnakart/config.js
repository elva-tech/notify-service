/**
 * Compatibility wrapper — metadata loaded from backend/config/businesses/apnakart/business.json.
 * @deprecated Prefer registry getBusiness('apnakart') after startup.
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

const module = loadBusinessModuleFromFolder('apnakart');

module.exports = {
  businessId: module.businessId,
  displayName: module.displayName,
  version: module.version,
  dlt: module.dlt,
};
