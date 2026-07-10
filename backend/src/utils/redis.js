const { createClient } = require("redis");
const logger = require("./logger");
const config = require("../config/config");

let redisClient = null;
let isRedisConnected = false;

const initRedis = async () => {
  if (!config.REDIS_URL && !process.env.REDIS_URL) {
    logger.warn("Redis URL not provided. Running without Redis caching.");
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || config.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
      isRedisConnected = true;
    });

    redisClient.on("end", () => {
      logger.warn("Redis connection closed");
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.error("Failed to initialize Redis:", err);
    isRedisConnected = false;
    return null;
  }
};

const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis get error for key ${key}:`, err);
    return null;
  }
};

const setCache = async (key, value, expirationSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error(`Redis set error for key ${key}:`, err);
  }
};

const delCache = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Redis del error for key ${key}:`, err);
  }
};

const clearCachePrefix = async (prefix) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
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
  get isConnected() { return isRedisConnected; }
};
