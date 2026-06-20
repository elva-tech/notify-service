/**
 * Compatibility wrapper — templates loaded from backend/config/businesses/apnakart/templates.json.
 * @deprecated Prefer registry getTemplate('apnakart', key).
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

module.exports = loadBusinessModuleFromFolder('apnakart').templates;
