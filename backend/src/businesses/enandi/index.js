/**
 * Compatibility wrapper — full module built from JSON configuration.
 * @deprecated Prefer registry getBusiness('enandi'). Removed in Phase 8.
 */

const { loadBusinessModuleFromFolder } = require('../configLoader');

module.exports = loadBusinessModuleFromFolder('enandi');
