/**
 * Business Registry
 * -----------------
 * Central index of registered business modules. Each module owns its template
 * catalog and business metadata; the registry does not send SMS or validate
 * runtime requests in Phase 1.
 *
 * Businesses are registered at startup via configLoader.loadBusinessConfigurations().
 * registerBusiness(module) remains available for the loader; add new businesses by
 * creating backend/config/businesses/<businessId>/ with business.json + templates.json.
 */

/** @type {Map<string, object>} */
const businesses = new Map();

/**
 * @param {object} module
 * @param {string} module.businessId
 * @param {object} module.templates
 */
function registerBusiness(module) {
  if (module == null || typeof module !== 'object') {
    throw new Error('Business module must be an object');
  }

  const { businessId, templates } = module;

  if (typeof businessId !== 'string' || !businessId.trim()) {
    throw new Error('Business module must define a non-empty businessId');
  }

  if (templates == null || typeof templates !== 'object' || Array.isArray(templates)) {
    throw new Error(`Business module "${businessId}" must define a templates object`);
  }

  if (businesses.has(businessId)) {
    throw new Error(`Business module already registered: ${businessId}`);
  }

  businesses.set(businessId, module);
}

/**
 * @param {string} businessId
 * @returns {object | null}
 */
function getBusiness(businessId) {
  if (typeof businessId !== 'string' || !businessId.trim()) {
    return null;
  }
  return businesses.get(businessId.trim()) ?? null;
}

/**
 * @returns {string[]}
 */
function listBusinesses() {
  return [...businesses.keys()];
}

/**
 * @param {string} businessId
 * @param {string} templateKey
 * @returns {object | null}
 */
function getTemplate(businessId, templateKey) {
  const business = getBusiness(businessId);
  if (!business || typeof business.getTemplate !== 'function') {
    return null;
  }
  return business.getTemplate(templateKey);
}

/**
 * @param {string} businessId
 * @returns {string[]}
 */
function listTemplates(businessId) {
  const business = getBusiness(businessId);
  if (!business || typeof business.listTemplateKeys !== 'function') {
    return [];
  }
  return business.listTemplateKeys();
}

module.exports = {
  registerBusiness,
  getBusiness,
  listBusinesses,
  getTemplate,
  listTemplates,
};
