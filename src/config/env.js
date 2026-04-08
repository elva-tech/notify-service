require('dotenv').config();

const port = parseInt(process.env.PORT || '3000', 10);

if (Number.isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
if (Number.isNaN(redisPort) || redisPort < 1 || redisPort > 65535) {
  throw new Error(`Invalid REDIS_PORT: ${process.env.REDIS_PORT}`);
}

const redisDb = process.env.REDIS_DB
  ? parseInt(process.env.REDIS_DB, 10)
  : undefined;
if (redisDb !== undefined && (Number.isNaN(redisDb) || redisDb < 0)) {
  throw new Error(`Invalid REDIS_DB: ${process.env.REDIS_DB}`);
}

module.exports = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY,
  },
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: redisPort,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
    db: redisDb,
  },
};
