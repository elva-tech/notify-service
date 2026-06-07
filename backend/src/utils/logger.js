const logBuffer = require('../services/logBuffer.service');

function toLogLine(level, event, data = {}) {
  const {
    category,
    requestId,
    business,
    templateKey,
    channel,
    recipient,
    status,
    provider,
    templateId,
    businessVersion,
    timestamp,
    ...rest
  } = data;

  const payload = {
    level,
    event,
    category: category ?? null,
    requestId: requestId ?? null,
    business: business ?? null,
    templateKey: templateKey ?? null,
    channel: channel ?? null,
    recipient: recipient ?? null,
    status: status ?? null,
    provider: provider ?? null,
    templateId: templateId ?? null,
    businessVersion: businessVersion ?? 'v1',
    timestamp: timestamp ?? new Date().toISOString(),
    ...rest,
  };

  return JSON.stringify(payload);
}

function emit(level, event, data = {}) {
  const line = toLogLine(level, event, data);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
  try {
    logBuffer.append(JSON.parse(line));
  } catch {
    // ignore malformed buffer entries
  }
}

function logInfo(event, data = {}) {
  emit('info', event, data);
}

function logError(event, data = {}) {
  emit('error', event, data);
}

module.exports = {
  logInfo,
  logError,
};
