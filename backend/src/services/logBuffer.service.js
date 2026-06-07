const MAX_ENTRIES = 1000;

/** @type {object[]} */
const entries = [];

/**
 * @param {object} entry
 */
function append(entry) {
  if (entry == null || typeof entry !== 'object') {
    return;
  }

  entries.push({
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  });

  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.business]
 * @param {number} [options.limit]
 * @param {string} [options.since]
 * @returns {object[]}
 */
function getLogs({ business, limit = 100, since } = {}) {
  let result = entries;

  if (typeof business === 'string' && business.trim()) {
    const id = business.trim();
    result = result.filter((entry) => entry.business === id);
  }

  if (typeof since === 'string' && since.trim()) {
    const cutoff = since.trim();
    result = result.filter((entry) => entry.timestamp > cutoff);
  }

  const capped = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return result.slice(-capped);
}

/**
 * @returns {string[]}
 */
function listBusinessesWithLogs() {
  const ids = new Set();
  for (const entry of entries) {
    if (typeof entry.business === 'string' && entry.business.trim()) {
      ids.add(entry.business.trim());
    }
  }
  return [...ids].sort();
}

module.exports = {
  append,
  getLogs,
  listBusinessesWithLogs,
};
