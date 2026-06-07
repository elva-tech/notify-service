const DEFAULT_BUSINESS_VERSION = 'v1';

/**
 * @param {string[]|string|null|undefined} to
 * @returns {string|null}
 */
function recipientFromList(to) {
  if (to == null) {
    return null;
  }
  const list = Array.isArray(to) ? to : [to];
  if (list.length === 0) {
    return null;
  }
  if (list.length === 1) {
    const value = list[0];
    return typeof value === 'string' ? value.trim() : null;
  }
  return `${list.length}_recipients`;
}

/**
 * @param {object} [context]
 * @returns {object}
 */
function buildLogContext(context = {}) {
  return {
    requestId: context.requestId ?? null,
    business: context.business ?? null,
    templateKey: context.templateKey ?? null,
    channel: context.channel ?? null,
    recipient: context.recipient ?? null,
    status: context.status ?? null,
    provider: context.provider ?? null,
    templateId: context.templateId ?? null,
    businessVersion: context.businessVersion ?? DEFAULT_BUSINESS_VERSION,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  DEFAULT_BUSINESS_VERSION,
  recipientFromList,
  buildLogContext,
};
