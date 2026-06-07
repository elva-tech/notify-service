const config = require('../../../config/env');
const { maskVariablesValues } = require('../../../utils/otpLogRedaction');
const { logDlt, logNotification } = require('../../logging/businessLogger.service');
const { buildLogContext } = require('../../logging/logContext');
const { logError } = require('../../../utils/logger');

const BULK_API_URL = 'https://www.fast2sms.com/dev/bulkV2';
const PROVIDER = 'fast2sms';

const REDACTED_BODY_KEYS = new Set([
  'authorization',
  'api_key',
  'apikey',
  'apiKey',
  'FAST2SMS_API_KEY',
]);

function sanitizeProviderBody(body) {
  if (body == null) {
    return null;
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const sanitized = Array.isArray(body) ? [...body] : { ...body };
  if (!Array.isArray(sanitized)) {
    for (const key of Object.keys(sanitized)) {
      if (REDACTED_BODY_KEYS.has(key)) {
        sanitized[key] = '[REDACTED]';
      }
    }
  }
  return sanitized;
}

function extractProviderErrorFields(body) {
  if (body == null) {
    return { providerErrorCode: null, providerErrorMessage: null };
  }

  if (typeof body !== 'object') {
    return {
      providerErrorCode: null,
      providerErrorMessage: String(body),
    };
  }

  const code =
    body.status_code ??
    body.statusCode ??
    body.code ??
    body.error_code ??
    body.errorCode ??
    null;

  let message = body.message ?? body.error ?? body.errors ?? body.msg ?? null;
  if (Array.isArray(message)) {
    message = message.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ');
  } else if (message != null && typeof message === 'object') {
    message = JSON.stringify(message);
  }

  return {
    providerErrorCode: code != null ? String(code) : null,
    providerErrorMessage: message != null ? String(message) : null,
  };
}

function buildRequestPayloadMetadata(payload) {
  return {
    route: payload.route ?? 'dlt',
    sender_id: payload.sender_id ?? null,
    message: payload.message ?? null,
    entity_id: payload.entity_id ?? null,
    variables_values: maskVariablesValues(payload.variables_values),
    numbers: payload.numbers ?? null,
  };
}

/**
 * Structured provider failure fields for logs (never includes API keys).
 *
 * @param {Response} response
 * @param {unknown} body
 * @param {object} [meta]
 * @returns {object}
 */
function buildProviderFailureDetails(response, body, meta = {}) {
  const { providerErrorCode, providerErrorMessage } = extractProviderErrorFields(body);

  return {
    provider: PROVIDER,
    httpStatus: response?.status ?? null,
    providerBody: sanitizeProviderBody(body),
    providerResponse: sanitizeProviderBody(body),
    providerErrorCode,
    providerErrorMessage,
    providerCode: providerErrorCode,
    providerMessage: providerErrorMessage,
    route: meta.route ?? null,
    senderId: meta.senderId ?? null,
    templateId: meta.templateId ?? null,
    entityId: meta.entityId ?? null,
  };
}

function summarizeProviderBody(body) {
  if (body == null || typeof body !== 'object') {
    return {};
  }
  return {
    return: body.return ?? undefined,
    requestId: body.request_id ?? undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
  };
}

function isProviderAccepted(response, body) {
  if (!response.ok) {
    return false;
  }
  if (body != null && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'return')) {
    return body.return !== false;
  }
  return true;
}

function logFast2SmsDltRejected({
  phone,
  logContext,
  response,
  body,
  dltMeta,
  requestPayload,
  durationMs,
}) {
  const context = buildLogContext({
    ...logContext,
    provider: PROVIDER,
    channel: 'SMS',
    recipient: phone,
    templateId: dltMeta.templateId,
    status: 'provider_failed',
  });

  const { providerErrorCode, providerErrorMessage } = extractProviderErrorFields(body);

  logError('fast2sms_dlt_rejected', {
    category: 'DLT',
    ...context,
    statusCode: response?.status ?? null,
    provider: PROVIDER,
    templateId: dltMeta.templateId ?? null,
    senderId: dltMeta.senderId ?? null,
    entityId: dltMeta.entityId ?? null,
    phone,
    durationMs,
    providerMessage: providerErrorMessage,
    providerCode: providerErrorCode,
    providerResponse: sanitizeProviderBody(body),
    requestPayload: buildRequestPayloadMetadata(requestPayload),
  });
}

function logProviderResponse(route, phone, logContext, response, body, ok, durationMs, dltMeta = {}) {
  const context = buildLogContext({
    ...logContext,
    provider: PROVIDER,
    channel: 'SMS',
    recipient: phone,
    status: ok ? 'completed' : 'provider_failed',
  });

  const failureMeta = {
    route,
    senderId: dltMeta.senderId ?? null,
    templateId: logContext.templateId ?? dltMeta.templateId ?? null,
    entityId: dltMeta.entityId ?? null,
  };

  const details = {
    route,
    httpStatus: response.status,
    durationMs,
    ...summarizeProviderBody(body),
  };

  if (!ok) {
    Object.assign(details, buildProviderFailureDetails(response, body, failureMeta));
  }

  const status = ok ? 'completed' : 'provider_failed';

  if (route === 'dlt') {
    logDlt(ok ? 'provider_response' : 'provider_response_failed', status, context, details);
    return;
  }

  logNotification(ok ? 'provider_response' : 'provider_response_failed', status, context, details);
}

function attachProviderFailureError(message, response, body, meta) {
  const providerFailure = buildProviderFailureDetails(response, body, meta);
  const err = new Error(message);
  err.cause = body;
  err.providerFailure = providerFailure;
  err.providerMessage = providerFailure.providerMessage;
  err.providerCode = providerFailure.providerCode;
  err.providerResponse = providerFailure.providerResponse;
  return err;
}

/**
 * @param {string} phone Digits-only number string (provider-specific formatting).
 * @param {string} message
 * @param {object} [logContext]
 * @returns {Promise<unknown>} Parsed JSON body from Fast2SMS.
 */
async function sendSMS(phone, message, logContext = {}) {
  const apiKey = config.fast2sms.apiKey?.trim();
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY is not set');
  }

  const startedAt = Date.now();
  const response = await fetch(BULK_API_URL, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      numbers: phone,
    }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  const accepted = isProviderAccepted(response, body);
  logProviderResponse('q', phone, logContext, response, body, accepted, Date.now() - startedAt);

  if (!accepted) {
    throw attachProviderFailureError(`Fast2SMS request failed: HTTP ${response.status}`, response, body, {
      route: 'q',
    });
  }

  return body;
}

/**
 * Sends SMS via Fast2SMS DLT route using a pre-resolved template payload.
 *
 * @param {object} params
 * @param {string} params.phone
 * @param {string} params.senderId
 * @param {string} params.templateId
 * @param {string} params.messageId
 * @param {string} params.variablesValues
 * @param {string} params.entityId
 * @param {object} [params.logContext]
 * @returns {Promise<unknown>}
 */
async function sendDltSMS({ phone, senderId, templateId, messageId, variablesValues, entityId, logContext = {} }) {
  const apiKey = config.fast2sms.apiKey?.trim();
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY is not set');
  }

  const payload = {
    route: 'dlt',
    sender_id: senderId,
    message: messageId,
    variables_values: variablesValues,
    language: 'english',
    numbers: phone,
  };

  if (entityId) {
    payload.entity_id = entityId;
  }

  const startedAt = Date.now();
  const response = await fetch(BULK_API_URL, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  const dltMeta = {
    senderId,
    templateId,
    messageId,
    entityId: entityId ?? null,
  };

  const accepted = isProviderAccepted(response, body);
  const durationMs = Date.now() - startedAt;

  logProviderResponse(
    'dlt',
    phone,
    {
      ...logContext,
      templateId,
      messageId,
    },
    response,
    body,
    accepted,
    durationMs,
    dltMeta,
  );

  if (!accepted) {
    logFast2SmsDltRejected({
      phone,
      logContext: {
        ...logContext,
        templateId,
        messageId,
      },
      response,
      body,
      dltMeta,
      requestPayload: payload,
      durationMs,
    });

    const httpStatus = response.status;
    const { providerErrorMessage } = extractProviderErrorFields(body);
    const detailSuffix = providerErrorMessage ? `: ${providerErrorMessage}` : '';
    throw attachProviderFailureError(
      `Fast2SMS DLT request failed: HTTP ${httpStatus}${detailSuffix}`,
      response,
      body,
      {
        route: 'dlt',
        ...dltMeta,
      },
    );
  }

  return body;
}

module.exports = {
  sendSMS,
  sendDltSMS,
  buildProviderFailureDetails,
  maskVariablesValues,
  buildRequestPayloadMetadata,
};
