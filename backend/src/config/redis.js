const redis = require("redis");
const logger = require("../utils/logger");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = redis.createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        return new Error("Redis connection retries exhausted");
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

redisClient.on("error", (err) => {
  // Log error but don't crash. Cache middleware will gracefully handle it.
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on("end", () => {
  logger.warn("Redis client connection closed");
});

module.exports = redisClient;
