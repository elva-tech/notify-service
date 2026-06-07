const { createClient } = require('redis');
const config = require('../config/env');

const OTP_KEY_PREFIX = 'otp:';

let client = null;

function buildClientOptions() {
  const { redis } = config;
  if (redis.url) {
    return { url: redis.url };
  }

  const socket = {
    host: redis.host,
    port: redis.port,
  };
  if (redis.tls) {
    socket.tls = true;
  }

  const options = { socket };
  if (redis.username) {
    options.username = redis.username;
  }
  if (redis.password) {
    options.password = redis.password;
  }
  if (redis.db !== undefined) {
    options.database = redis.db;
  }
  return options;
}

function registerClientErrorLogging(redisClient) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });
}

async function connectRedis() {
  if (client?.isOpen) {
    return client;
  }
  if (!client) {
    client = createClient(buildClientOptions());
    registerClientErrorLogging(client);
  }
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

async function getClient() {
  return connectRedis();
}

async function disconnectRedis() {
  if (client?.isOpen) {
    await client.quit();
  }
  client = null;
}

/**
 * @param {string} normalizedAppId
 * @param {string} normalizedPhone
 */
function otpKey(normalizedAppId, normalizedPhone) {
  return `${OTP_KEY_PREFIX}${normalizedAppId}:${normalizedPhone}`;
}

/**
 * Per app + phone send cooldown (short TTL between SMS sends).
 * @param {string} normalizedAppId
 * @param {string} normalizedPhone
 */
function otpCooldownKey(normalizedAppId, normalizedPhone) {
  return `${OTP_KEY_PREFIX}cooldown:${normalizedAppId}:${normalizedPhone}`;
}

/**
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function existsKey(key) {
  const c = await getClient();
  return (await c.exists(key)) === 1;
}

/**
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {string} [value]
 */
async function setKeyWithExpire(key, ttlSeconds, value = '1') {
  const c = await getClient();
  await c.set(key, value, { EX: ttlSeconds });
}

/**
 * @param {string} key
 * @param {Record<string, string>} fields
 * @param {number} ttlSeconds
 */
async function setHashWithExpire(key, fields, ttlSeconds) {
  const c = await getClient();
  const multi = c.multi();
  multi.hSet(key, fields);
  multi.expire(key, ttlSeconds);
  await multi.exec();
}

/**
 * @param {string} key
 * @returns {Promise<Record<string, string>>}
 */
async function getHashAll(key) {
  const c = await getClient();
  return c.hGetAll(key);
}

/**
 * @param {string} key
 */
async function deleteKey(key) {
  const c = await getClient();
  await c.del(key);
}

/**
 * @param {string} key
 * @param {string} field
 * @param {number} increment
 * @returns {Promise<number>}
 */
async function hashIncrementBy(key, field, increment) {
  const c = await getClient();
  return c.hIncrBy(key, field, increment);
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getClient,
  otpKey,
  otpCooldownKey,
  existsKey,
  setKeyWithExpire,
  setHashWithExpire,
  getHashAll,
  deleteKey,
  hashIncrementBy,
};
