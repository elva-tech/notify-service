const fs = require('fs');
const path = require('path');
const registry = require('./registry');
const { validateBusinessConfig, validateTemplatesConfig } = require('./schemaValidator');

const BUSINESSES_CONFIG_ROOT = path.join(__dirname, '../../config/businesses');

/**
 * @param {string} folderName
 * @returns {object}
 */
function loadBusinessModuleFromFolder(folderName) {
  const businessDir = path.join(BUSINESSES_CONFIG_ROOT, folderName);
  const businessPath = path.join(businessDir, 'business.json');
  const templatesPath = path.join(businessDir, 'templates.json');

  if (!fs.existsSync(businessPath)) {
    throw new Error(`Missing business.json for business folder "${folderName}"`);
  }
  if (!fs.existsSync(templatesPath)) {
    throw new Error(`Missing templates.json for business folder "${folderName}"`);
  }

  const businessRaw = JSON.parse(fs.readFileSync(businessPath, 'utf8'));
  const templatesRaw = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

  const businessMeta = validateBusinessConfig(businessRaw, folderName);
  const templates = validateTemplatesConfig(templatesRaw, businessMeta);

  return buildBusinessModule(businessMeta, templates);
}

/**
 * @param {object} businessMeta
 * @param {Record<string, object>} templates
 */
function buildBusinessModule(businessMeta, templates) {
  const frozenTemplates = Object.freeze({ ...templates });

  /**
   * @param {string} templateKey
   * @returns {object | null}
   */
  function getTemplate(templateKey) {
    if (typeof templateKey !== 'string' || !templateKey.trim()) {
      return null;
    }
    return frozenTemplates[templateKey.trim()] ?? null;
  }

  /**
   * @returns {string[]}
   */
  function listTemplateKeys() {
    return Object.keys(frozenTemplates);
  }

  return Object.freeze({
    businessId: businessMeta.businessId,
    displayName: businessMeta.displayName,
    version: businessMeta.version,
    dlt: Object.freeze({
      entityId: businessMeta.dlt.entityId,
      defaultSenderId: businessMeta.dlt.defaultSenderId,
    }),
    templates: frozenTemplates,
    getTemplate,
    listTemplateKeys,
  });
}

function discoverBusinessFolders() {
  if (!fs.existsSync(BUSINESSES_CONFIG_ROOT)) {
    throw new Error(`Business configuration root not found: ${BUSINESSES_CONFIG_ROOT}`);
  }

  return fs
    .readdirSync(BUSINESSES_CONFIG_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function loadBusinessConfigurations() {
  const folders = discoverBusinessFolders();

  if (folders.length === 0) {
    throw new Error(`No business configuration folders found in ${BUSINESSES_CONFIG_ROOT}`);
  }

  const modules = folders.map((folderName) => loadBusinessModuleFromFolder(folderName));

  const businessIds = new Set();
  for (const module of modules) {
    if (businessIds.has(module.businessId)) {
      throw new Error(`Duplicate businessId "${module.businessId}" in configuration`);
    }
    businessIds.add(module.businessId);
  }

  for (const module of modules) {
    registry.registerBusiness(module);
  }
}

module.exports = {
  BUSINESSES_CONFIG_ROOT,
  buildBusinessModule,
  loadBusinessModuleFromFolder,
  loadBusinessConfigurations,
  discoverBusinessFolders,
};
