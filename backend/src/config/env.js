require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

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
  otp: {
    dltEnabled: process.env.OTP_DLT_ENABLED === 'true',
  },
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY,
    entityId: process.env.FAST2SMS_ENTITY_ID || null,
    defaultSenderId: process.env.FAST2SMS_DEFAULT_SENDER_ID || null,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  email: {
    from: process.env.EMAIL_FROM,
  },
  integrations: {
    adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL?.trim() || null,
    opsAdminToken: process.env.OPS_ADMIN_TOKEN?.trim() || null,
    publicPlatformUrl: process.env.PLATFORM_PUBLIC_URL?.trim() || 'http://localhost:3000',
    integrationAppId: process.env.INTEGRATION_APP_ID?.trim() || null,
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
