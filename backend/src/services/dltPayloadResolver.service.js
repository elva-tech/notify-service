/**
 * Builds Fast2SMS DLT payloads from validated template requests.
 * Resolves DLT metadata: template → business → environment fallback.
 */

const { getBusiness } = require('../businesses/registry');
const { fast2sms: fast2smsConfig } = require('../config/env');
const { TemplateValidationError } = require('./templateValidation/errors');
const { logDlt } = require('./logging/businessLogger.service');
const { buildLogContext } = require('./logging/logContext');

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function assertDltMetadataReady({ templateId, messageId, senderId, entityId }, context) {
  const missing = [];
  if (!templateId) missing.push('templateId');
  if (!messageId) missing.push('messageId');
  if (!senderId) missing.push('senderId');
  if (!entityId) missing.push('entityId');

  if (missing.length > 0) {
    throw new TemplateValidationError(
      'dlt_metadata_missing',
      `DLT metadata incomplete for template ${context.templateKey}`,
      { businessId: context.businessId, templateKey: context.templateKey, missing },
    );
  }
}

function buildVariablesValues(template, variables) {
  const schema = Array.isArray(template.variables) ? [...template.variables] : [];
  schema.sort((a, b) => a.position - b.position);

  return schema.map((entry) => {
    const value = variables[entry.name];
    if (value === undefined || value === null || value === '') {
      throw new TemplateValidationError(
        'missing_variable',
        `Missing required variable: ${entry.name}`,
        { variable: entry.name },
      );
    }
    return String(value);
  }).join('|');
}

/**
 * @param {{
 *   businessId: string,
 *   templateKey: string,
 *   template: object,
 *   variables: Record<string, string>
 * }} validated
 * @param {object} [logContext]
 * @returns {{
 *   senderId: string,
 *   templateId: string,
 *   messageId: string,
 *   entityId: string,
 *   variablesValues: string
 * }}
 */
function buildDltPayload(validated, logContext = {}) {
  const business = getBusiness(validated.businessId);
  const baseContext = buildLogContext({
    ...logContext,
    business: validated.businessId,
    templateKey: validated.templateKey,
  });
  const templateDlt = validated.template?.dlt ?? {};
  const businessDlt = business?.dlt ?? {};

  const templateId = firstNonEmpty(templateDlt.templateId);
  const messageId = firstNonEmpty(templateDlt.messageId);
  const senderId = firstNonEmpty(
    templateDlt.senderId,
    businessDlt.defaultSenderId,
    fast2smsConfig.defaultSenderId,
  );
  const entityId = firstNonEmpty(
    templateDlt.entityId,
    businessDlt.entityId,
    fast2smsConfig.entityId,
  );

  assertDltMetadataReady(
    { templateId, messageId, senderId, entityId },
    { businessId: validated.businessId, templateKey: validated.templateKey },
  );

  const variablesValues = buildVariablesValues(validated.template, validated.variables);

  const payload = {
    senderId,
    templateId,
    messageId,
    entityId,
    variablesValues,
  };

  logDlt(
    'dlt_payload_ready',
    'validated',
    {
      ...baseContext,
      templateId,
      messageId,
      provider: logContext.provider ?? 'fast2sms',
      channel: logContext.channel ?? 'SMS',
    },
    { senderId, entityId, messageId },
  );

  return payload;
}

module.exports = {
  buildDltPayload,
};
