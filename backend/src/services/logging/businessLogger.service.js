/**
 * Centralized Business Logging Layer (Phase 4).
 * All structured logs flow through this module.
 */

const { logInfo, logError } = require('../../utils/logger');
const { LOG_CATEGORIES } = require('./logCategories');
const { buildLogContext } = require('./logContext');

/**
 * @param {string} category
 * @param {'info'|'error'} level
 * @param {string} event
 * @param {string} status
 * @param {object} [context]
 * @param {object} [details]
 */
function log(category, level, event, status, context = {}, details = {}) {
  const payload = {
    category,
    event,
    ...buildLogContext({ ...context, status }),
    ...details,
  };

  if (level === 'error') {
    logError(event, payload);
    return;
  }

  logInfo(event, payload);
}

function logSystem(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.SYSTEM, 'info', event, status, context, details);
}

function logBusiness(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.BUSINESS, 'info', event, status, context, details);
}

function logOtp(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.OTP, 'info', event, status, context, details);
}

function logNotification(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.NOTIFICATION, 'info', event, status, context, details);
}

function logDlt(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.DLT, 'info', event, status, context, details);
}

function logErrorCategory(event, status, context = {}, details = {}) {
  log(LOG_CATEGORIES.ERROR, 'error', event, status, context, details);
}

module.exports = {
  logSystem,
  logBusiness,
  logOtp,
  logNotification,
  logDlt,
  logError: logErrorCategory,
};
