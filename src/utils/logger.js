function toLogLine(level, event, data = {}) {
  const requestId = data.requestId ?? null;
  const payload = {
    level,
    event,
    requestId,
    timestamp: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload);
}

function logInfo(event, data = {}) {
  console.log(toLogLine('info', event, data));
}

function logError(event, data = {}) {
  console.error(toLogLine('error', event, data));
}

module.exports = {
  logInfo,
  logError,
};
