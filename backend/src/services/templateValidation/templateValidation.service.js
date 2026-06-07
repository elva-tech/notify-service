/**
 * Template Validation Layer (Phase 2)
 * -------------------------------------
 * Resolves business and template from the Business Registry and validates
 * variables against the business module schema. Does not send SMS or build
 * DLT payloads.
 */

const { getBusiness, getTemplate } = require('../../businesses');
const { TemplateValidationError } = require('./errors');
const { validateVariables } = require('./variableValidator');
const { logBusiness, logDlt, logError } = require('../logging/businessLogger.service');
const { buildLogContext } = require('../logging/logContext');

function normalizeBusinessId(businessId) {
  if (typeof businessId !== 'string' || !businessId.trim()) {
    throw new TemplateValidationError(
      'validation_error',
      'business must be a non-empty string',
      { field: 'business' },
    );
  }
  return businessId.trim();
}

function normalizeTemplateKey(templateKey) {
  if (typeof templateKey !== 'string' || !templateKey.trim()) {
    throw new TemplateValidationError(
      'validation_error',
      'templateKey must be a non-empty string',
      { field: 'templateKey' },
    );
  }
  return templateKey.trim();
}

/**
 * @param {object} input
 * @param {string} input.business
 * @param {string} input.templateKey
 * @param {object} [input.variables]
 * @param {'template'} [input.mode]
 * @param {object} [input.logContext]
 * @returns {{
 *   mode: string,
 *   businessId: string,
 *   templateKey: string,
 *   template: object,
 *   variables: Record<string, string>
 * }}
 */
function validateTemplateRequest(input) {
  const baseContext = buildLogContext({
    ...input?.logContext,
    business: input?.logContext?.business ?? input?.business ?? null,
    templateKey: input?.logContext?.templateKey ?? input?.templateKey ?? null,
  });

  const businessId = normalizeBusinessId(input?.business);
  const templateKey = normalizeTemplateKey(input?.templateKey);

  const business = getBusiness(businessId);
  if (!business) {
    logBusiness(
      'business_resolution_failed',
      'rejected',
      { ...baseContext, business: businessId },
      { errorCode: 'unsupported_business' },
    );
    logError(
      'business_resolution_failed',
      'rejected',
      { ...baseContext, business: businessId },
      { errorCode: 'unsupported_business' },
    );
    throw new TemplateValidationError(
      'unsupported_business',
      `Unsupported business: ${businessId}`,
      { business: businessId },
    );
  }

  logBusiness(
    'business_resolved',
    'validated',
    { ...baseContext, business: businessId },
  );

  const template = getTemplate(businessId, templateKey);
  if (!template) {
    logBusiness(
      'template_resolution_failed',
      'rejected',
      { ...baseContext, business: businessId, templateKey },
      { errorCode: 'invalid_template' },
    );
    logError(
      'template_resolution_failed',
      'rejected',
      { ...baseContext, business: businessId, templateKey },
      { errorCode: 'invalid_template' },
    );
    throw new TemplateValidationError(
      'invalid_template',
      `Unknown templateKey: ${templateKey}`,
      { business: businessId, templateKey },
    );
  }

  logBusiness(
    'template_resolved',
    'validated',
    {
      ...baseContext,
      business: businessId,
      templateKey,
      templateId: template.dlt?.templateId ?? null,
    },
  );

  if (input?.rejectOtpTemplates) {
    const variableNames = (Array.isArray(template.variables) ? template.variables : []).map(
      (entry) => entry.name,
    );
    if (variableNames.includes('otp')) {
      throw new TemplateValidationError(
        'otp_template_not_supported',
        'OTP delivery must use POST /otp/send and POST /otp/verify. ELVA generates and verifies the OTP; do not pass otp in /notify variables.',
        { business: businessId, templateKey },
      );
    }
  }

  try {
    const variables = validateVariables(template.variables, input?.variables);
    logDlt(
      'template_validated',
      'validated',
      {
        ...baseContext,
        business: businessId,
        templateKey,
        templateId: template.dlt?.templateId ?? null,
      },
    );

    return {
      mode: input?.mode ?? 'template',
      businessId,
      templateKey,
      template,
      variables,
    };
  } catch (err) {
    if (err instanceof TemplateValidationError) {
      logDlt(
        'template_validation_failed',
        'rejected',
        {
          ...baseContext,
          business: businessId,
          templateKey,
          templateId: template.dlt?.templateId ?? null,
        },
        { errorCode: err.code, message: err.message },
      );
      logError(
        'template_validation_failed',
        'rejected',
        {
          ...baseContext,
          business: businessId,
          templateKey,
          templateId: template.dlt?.templateId ?? null,
        },
        { errorCode: err.code, message: err.message },
      );
    }
    throw err;
  }
}

module.exports = {
  validateTemplateRequest,
};
