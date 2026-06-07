class TemplateValidationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {object} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TemplateValidationError';
    this.code = code;
    this.details = details;
  }
}

module.exports = {
  TemplateValidationError,
};
