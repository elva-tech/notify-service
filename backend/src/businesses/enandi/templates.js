/**
 * Compatibility wrapper — templates loaded from backend/config/businesses/enandi/templates.json.
 * @deprecated Prefer registry getTemplate('enandi', key). Removed in Phase 8.
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

module.exports = loadBusinessModuleFromFolder('enandi').templates;
