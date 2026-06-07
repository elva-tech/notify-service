function normalizeEmail(email) {
  if (typeof email !== 'string') {
    throw new TypeError('email must be a string');
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error('email cannot be empty');
  }

  if (normalized.includes(':')) {
    throw new Error('email cannot contain ":"');
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!isValid) {
    throw new Error('Invalid email address');
  }

  return normalized;
}

module.exports = {
  normalizeEmail,
};
