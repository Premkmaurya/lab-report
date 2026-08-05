const sharedRedisClient = require("../config/redis");
const logger = require("./logger");

const initRedis = async () => {
  try {
    if (!sharedRedisClient.isOpen && !sharedRedisClient.isReady) {
      await sharedRedisClient.connect();
    }
    return sharedRedisClient;
  } catch (err) {
    logger.error("Failed to initialize Redis:", err);
    return null;
  }
};

const getCache = async (key) => {
  if (!sharedRedisClient.isReady) return null;
  try {
    const data = await sharedRedisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis get error for key ${key}:`, err);
    return null;
  }
};

const setCache = async (key, value, expirationSeconds = 300) => {
  if (!sharedRedisClient.isReady) return;
  try {
    await sharedRedisClient.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error(`Redis set error for key ${key}:`, err);
  }
};

const delCache = async (key) => {
  if (!sharedRedisClient.isReady) return;
  try {
    await sharedRedisClient.del(key);
  } catch (err) {
    logger.error(`Redis del error for key ${key}:`, err);
  }
};

const clearCachePrefix = async (prefix) => {
  if (!sharedRedisClient.isReady) return;
  try {
    const keys = await sharedRedisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await sharedRedisClient.del(keys);
    }
  } catch (err) {
    logger.error(`Redis clear prefix error for ${prefix}:`, err);
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  delCache,
  clearCachePrefix,
  get isConnected() {
    return sharedRedisClient.isReady;
  },
};
