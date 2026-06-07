const config = require('../config/env');

/**
 * Extract normalized provider failure fields from a thrown provider error.
 *
 * @param {unknown} err
 * @returns {{
 *   providerMessage: string | null,
 *   providerCode: string | null,
 *   providerResponse: unknown,
 *   httpStatus: number | null,
 *   provider: string | null,
 * }}
 */
function extractProviderFailure(err) {
  const providerFailure =
    err instanceof Error && err.providerFailure && typeof err.providerFailure === 'object'
      ? err.providerFailure
      : null;

  const providerResponse =
    providerFailure?.providerBody ??
    (err instanceof Error && err.cause != null ? err.cause : null);

  return {
    providerMessage:
      providerFailure?.providerErrorMessage ??
      (typeof providerResponse === 'object' && providerResponse?.message != null
        ? String(providerResponse.message)
        : null),
    providerCode:
      providerFailure?.providerErrorCode ??
      (typeof providerResponse === 'object' && providerResponse?.status_code != null
        ? String(providerResponse.status_code)
        : null),
    providerResponse,
    httpStatus: providerFailure?.httpStatus ?? null,
    provider: providerFailure?.provider ?? 'fast2sms',
  };
}

/**
 * Dev-only provider block for API error responses. Returns undefined in production.
 *
 * @param {unknown} err
 * @returns {object | undefined}
 */
function buildDevProviderError(err) {
  if (config.nodeEnv !== 'development') {
    return undefined;
  }

  const failure = extractProviderFailure(err);
  if (!failure.providerMessage && failure.httpStatus == null && failure.providerResponse == null) {
    return undefined;
  }

  return {
    name: failure.provider ?? 'fast2sms',
    status: failure.httpStatus,
    message: failure.providerMessage,
    ...(failure.providerCode ? { code: failure.providerCode } : {}),
    ...(failure.providerResponse != null ? { response: failure.providerResponse } : {}),
  };
}

module.exports = {
  extractProviderFailure,
  buildDevProviderError,
};
