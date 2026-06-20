/**
 * @deprecated Prefer registry getBusiness('apnakart'). Removed in Phase 8.
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

module.exports = loadBusinessModuleFromFolder('apnakart');
