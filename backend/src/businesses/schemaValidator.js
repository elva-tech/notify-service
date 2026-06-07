const ALLOWED_VARIABLE_TYPES = new Set(['numeric', 'string', 'date', 'datetime', 'time']);
const OPTIONAL_VARIABLE_FIELDS = new Set(['pattern', 'length', 'digitsOnly', 'maxLength', 'format']);

/**
 * @param {unknown} value
 * @param {string} label
 */
function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

/**
 * @param {object} businessConfig
 * @param {string} folderName
 */
function validateBusinessConfig(businessConfig, folderName) {
  if (businessConfig == null || typeof businessConfig !== 'object' || Array.isArray(businessConfig)) {
    throw new Error(`business.json for "${folderName}" must be a JSON object`);
  }

  const businessId = assertNonEmptyString(businessConfig.businessId, `business.json businessId (${folderName})`);
  const displayName = assertNonEmptyString(businessConfig.displayName, `business.json displayName (${folderName})`);
  const version = assertNonEmptyString(businessConfig.version, `business.json version (${folderName})`);

  if (businessId !== folderName) {
    throw new Error(
      `business.json businessId "${businessId}" must match folder name "${folderName}"`,
    );
  }

  const dlt = businessConfig.dlt;
  if (dlt == null || typeof dlt !== 'object' || Array.isArray(dlt)) {
    throw new Error(`business.json dlt for "${businessId}" must be an object`);
  }

  const entityId = assertNonEmptyString(dlt.entityId, `business.json dlt.entityId (${businessId})`);
  const defaultSenderId = assertNonEmptyString(
    dlt.defaultSenderId,
    `business.json dlt.defaultSenderId (${businessId})`,
  );

  return {
    businessId,
    displayName,
    version,
    dlt: {
      entityId,
      defaultSenderId,
    },
  };
}

/**
 * @param {object} variable
 * @param {string} templateKey
 * @param {number} index
 */
function validateVariableSchema(variable, templateKey, index) {
  if (variable == null || typeof variable !== 'object' || Array.isArray(variable)) {
    throw new Error(`Template "${templateKey}" variable at index ${index} must be an object`);
  }

  const name = assertNonEmptyString(variable.name, `Template "${templateKey}" variable.name`);
  const type = assertNonEmptyString(variable.type, `Template "${templateKey}" variable "${name}" type`);

  if (!ALLOWED_VARIABLE_TYPES.has(type)) {
    throw new Error(
      `Template "${templateKey}" variable "${name}" has unsupported type "${type}"`,
    );
  }

  if (typeof variable.position !== 'number' || !Number.isInteger(variable.position) || variable.position < 1) {
    throw new Error(
      `Template "${templateKey}" variable "${name}" must have a positive integer position`,
    );
  }

  if (typeof variable.required !== 'boolean') {
    throw new Error(`Template "${templateKey}" variable "${name}" must define required as boolean`);
  }

  for (const key of Object.keys(variable)) {
    if (key === 'name' || key === 'position' || key === 'type' || key === 'required') {
      continue;
    }
    if (!OPTIONAL_VARIABLE_FIELDS.has(key)) {
      throw new Error(
        `Template "${templateKey}" variable "${name}" has unknown field "${key}"`,
      );
    }
  }

  if (variable.pattern != null && typeof variable.pattern !== 'string') {
    throw new Error(`Template "${templateKey}" variable "${name}" pattern must be a string`);
  }
  if (variable.length != null && (!Number.isInteger(variable.length) || variable.length < 1)) {
    throw new Error(`Template "${templateKey}" variable "${name}" length must be a positive integer`);
  }
  if (variable.digitsOnly != null && typeof variable.digitsOnly !== 'boolean') {
    throw new Error(`Template "${templateKey}" variable "${name}" digitsOnly must be boolean`);
  }
  if (variable.maxLength != null && (!Number.isInteger(variable.maxLength) || variable.maxLength < 1)) {
    throw new Error(`Template "${templateKey}" variable "${name}" maxLength must be a positive integer`);
  }
  if (variable.format != null && typeof variable.format !== 'string') {
    throw new Error(`Template "${templateKey}" variable "${name}" format must be a string`);
  }

  return {
    name,
    position: variable.position,
    type,
    required: variable.required,
    ...(variable.pattern != null ? { pattern: variable.pattern } : {}),
    ...(variable.length != null ? { length: variable.length } : {}),
    ...(variable.digitsOnly != null ? { digitsOnly: variable.digitsOnly } : {}),
    ...(variable.maxLength != null ? { maxLength: variable.maxLength } : {}),
    ...(variable.format != null ? { format: variable.format } : {}),
  };
}

/**
 * @param {object} templatesConfig
 * @param {object} businessMeta
 */
function validateTemplatesConfig(templatesConfig, businessMeta) {
  const businessId = businessMeta.businessId;

  if (templatesConfig == null || typeof templatesConfig !== 'object' || Array.isArray(templatesConfig)) {
    throw new Error(`templates.json for "${businessId}" must be a JSON object`);
  }

  const { templates } = templatesConfig;
  if (!Array.isArray(templates) || templates.length === 0) {
    throw new Error(`templates.json for "${businessId}" must define a non-empty templates array`);
  }

  const templateKeys = new Set();
  const templateIds = new Set();
  const messageIds = new Set();

  /** @type {Record<string, object>} */
  const catalog = {};

  for (const [index, entry] of templates.entries()) {
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`templates.json entry at index ${index} for "${businessId}" must be an object`);
    }

    const templateKey = assertNonEmptyString(
      entry.templateKey,
      `templates.json templateKey (${businessId}, index ${index})`,
    );
    const purpose = assertNonEmptyString(
      entry.purpose,
      `templates.json purpose for "${templateKey}" (${businessId})`,
    );
    const templateId = assertNonEmptyString(
      entry.templateId,
      `templates.json templateId for "${templateKey}" (${businessId})`,
    );
    const messageId = assertNonEmptyString(
      entry.messageId,
      `templates.json messageId for "${templateKey}" (${businessId})`,
    );

    if (templateKey !== entry.templateKey) {
      throw new Error(`Template key mismatch for "${templateKey}" in "${businessId}"`);
    }

    if (templateKeys.has(templateKey)) {
      throw new Error(`Duplicate templateKey "${templateKey}" in business "${businessId}"`);
    }
    templateKeys.add(templateKey);

    if (templateIds.has(templateId)) {
      throw new Error(`Duplicate templateId "${templateId}" in business "${businessId}"`);
    }
    templateIds.add(templateId);

    if (messageIds.has(messageId)) {
      throw new Error(`Duplicate messageId "${messageId}" in business "${businessId}"`);
    }
    messageIds.add(messageId);

    if (!Array.isArray(entry.variables) || entry.variables.length === 0) {
      throw new Error(`Template "${templateKey}" in "${businessId}" must define a non-empty variables array`);
    }

    const positions = new Set();
    const variables = entry.variables.map((variable, varIndex) => {
      const normalized = validateVariableSchema(variable, templateKey, varIndex);
      if (positions.has(normalized.position)) {
        throw new Error(
          `Duplicate variable position ${normalized.position} in template "${templateKey}" (${businessId})`,
        );
      }
      positions.add(normalized.position);
      return Object.freeze(normalized);
    });

    catalog[templateKey] = Object.freeze({
      templateKey,
      purpose,
      dlt: Object.freeze({
        templateId,
        messageId,
        senderId: businessMeta.dlt.defaultSenderId,
        entityId: businessMeta.dlt.entityId,
      }),
      variables: Object.freeze(variables),
    });
  }

  return Object.freeze(catalog);
}

module.exports = {
  validateBusinessConfig,
  validateTemplatesConfig,
};
