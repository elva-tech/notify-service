const REDACTED_OTP = '******';

/**
 * Masks pipe-delimited DLT variable values for logs.
 * Six-digit segments (OTP codes) are replaced with REDACTED_OTP.
 *
 * @param {string | null | undefined} variablesValues
 * @returns {string | null}
 */
function maskVariablesValues(variablesValues) {
  if (typeof variablesValues !== 'string' || !variablesValues) {
    return variablesValues ?? null;
  }

  return variablesValues
    .split('|')
    .map((segment) => (/^\d{6}$/.test(segment) ? REDACTED_OTP : segment))
    .join('|');
}

/**
 * Returns a shallow copy of resolved template variables safe for logs.
 * Never logs plaintext OTP.
 *
 * @param {Record<string, unknown> | null | undefined} variables
 * @returns {Record<string, unknown> | null}
 */
function redactResolvedVariables(variables) {
  if (variables == null || typeof variables !== 'object' || Array.isArray(variables)) {
    return variables ?? null;
  }

  const redacted = { ...variables };
  if (Object.prototype.hasOwnProperty.call(redacted, 'otp')) {
    redacted.otp = REDACTED_OTP;
  }
  return redacted;
}

module.exports = {
  REDACTED_OTP,
  maskVariablesValues,
  redactResolvedVariables,
};
