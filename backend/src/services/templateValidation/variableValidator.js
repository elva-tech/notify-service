const { TemplateValidationError } = require('./errors');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function assertPlainObject(value, fieldName) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TemplateValidationError(
      'validation_error',
      `${fieldName} must be an object`,
      { field: fieldName },
    );
  }
  return value;
}

function validateNumeric(value, schema) {
  const str = String(value);
  if (!/^\d+$/.test(str)) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must contain only digits`,
      { variable: schema.name },
    );
  }
  if (schema.length != null && str.length !== schema.length) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must be exactly ${schema.length} digits`,
      { variable: schema.name },
    );
  }
  return str;
}

function validateString(value, schema) {
  const str = String(value).trim();
  if (!str) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" cannot be empty`,
      { variable: schema.name },
    );
  }
  if (schema.maxLength != null && str.length > schema.maxLength) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must be at most ${schema.maxLength} characters`,
      { variable: schema.name },
    );
  }
  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(str)) {
      throw new TemplateValidationError(
        'validation_error',
        `Variable "${schema.name}" has an invalid format`,
        { variable: schema.name },
      );
    }
  }
  return str;
}

function validateDate(value, schema) {
  const str = String(value).trim();
  if (!DATE_PATTERN.test(str)) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must match YYYY-MM-DD`,
      { variable: schema.name },
    );
  }
  return str;
}

function validateDateTime(value, schema) {
  const str = String(value).trim();
  if (!DATETIME_PATTERN.test(str)) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must match YYYY-MM-DD HH:mm`,
      { variable: schema.name },
    );
  }
  return str;
}

function validateTime(value, schema) {
  const str = String(value).trim();
  if (!TIME_PATTERN.test(str)) {
    throw new TemplateValidationError(
      'validation_error',
      `Variable "${schema.name}" must match HH:mm`,
      { variable: schema.name },
    );
  }
  return str;
}

function validateVariableValue(schema, rawValue) {
  if (rawValue === undefined || rawValue === null) {
    if (schema.required) {
      throw new TemplateValidationError(
        'missing_variable',
        `Missing required variable: ${schema.name}`,
        { variable: schema.name },
      );
    }
    return undefined;
  }

  switch (schema.type) {
    case 'numeric':
      return validateNumeric(rawValue, schema);
    case 'string':
      return validateString(rawValue, schema);
    case 'date':
      return validateDate(rawValue, schema);
    case 'datetime':
      return validateDateTime(rawValue, schema);
    case 'time':
      return validateTime(rawValue, schema);
    default:
      throw new TemplateValidationError(
        'validation_error',
        `Unsupported variable type for "${schema.name}": ${schema.type}`,
        { variable: schema.name },
      );
  }
}

/**
 * @param {object[]} variableSchemas
 * @param {object} variables
 * @returns {Record<string, string>}
 */
function validateVariables(variableSchemas, variables) {
  const input = assertPlainObject(variables, 'variables');
  const schemaList = Array.isArray(variableSchemas) ? variableSchemas : [];
  const allowedNames = new Set(schemaList.map((entry) => entry.name));

  for (const key of Object.keys(input)) {
    if (!allowedNames.has(key)) {
      throw new TemplateValidationError(
        'validation_error',
        `Unknown variable: ${key}`,
        { variable: key },
      );
    }
  }

  const normalized = Object.create(null);
  for (const schema of schemaList) {
    const value = validateVariableValue(schema, input[schema.name]);
    if (value !== undefined) {
      normalized[schema.name] = value;
    } else if (schema.required) {
      throw new TemplateValidationError(
        'missing_variable',
        `Missing required variable: ${schema.name}`,
        { variable: schema.name },
      );
    }
  }

  return normalized;
}

module.exports = {
  validateVariables,
};
