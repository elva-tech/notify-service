const rateLimit = require('express-rate-limit');

function resolveRateLimitKey(req) {
  const appId = req.body?.appId;
  if (typeof appId === 'string' && appId.trim()) {
    return `appId:${appId.trim()}`;
  }

  const apiKey = req.body?.apiKey;
  if (typeof apiKey === 'string' && apiKey.trim()) {
    return `apiKey:${apiKey.trim()}`;
  }

  return `ip:${req.ip}`;
}

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => resolveRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'rate_limited',
      message: 'Too many requests. Please try again later.',
      requestId: req.requestId,
    });
  },
});

module.exports = rateLimiter;
