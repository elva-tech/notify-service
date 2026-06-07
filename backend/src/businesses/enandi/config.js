/**
 * Compatibility wrapper — metadata loaded from backend/config/businesses/enandi/business.json.
 * @deprecated Prefer registry getBusiness('enandi') after startup. Removed in Phase 8.
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

const module = loadBusinessModuleFromFolder('enandi');

module.exports = {
  businessId: module.businessId,
  displayName: module.displayName,
  version: module.version,
  dlt: module.dlt,
};
