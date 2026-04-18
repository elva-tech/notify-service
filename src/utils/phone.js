function normalizePhone(phone) {
  if (typeof phone !== 'string') {
    throw new TypeError('phone must be a string');
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    throw new Error('phone must contain at least one digit');
  }
  console.log(`Normalized phone: ${digits}`);
  return digits;
}

module.exports = { normalizePhone };
