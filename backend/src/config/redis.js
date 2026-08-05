const redis = require("redis");
const logger = require("../utils/logger");
const config = require("./config");

const getRedisConnectionOptions = () => {
  if (config.REDIS_URL) {
    return { url: config.REDIS_URL };
  }

  const socket = {
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT),
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.error("Redis connection retries exhausted");
        return new Error("Redis connection retries exhausted");
      }
      return Math.min(retries * 100, 3000);
    },
  };

  const options = { socket };
  if (config.REDIS_USERNAME) options.username = config.REDIS_USERNAME;
  if (config.REDIS_PASSWORD) options.password = config.REDIS_PASSWORD;

  return options;
};

const redisOptions = {
  ...getRedisConnectionOptions(),
  socket: {
    ...(getRedisConnectionOptions().socket || {}),
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        return new Error("Redis connection retries exhausted");
      }
      return Math.min(retries * 100, 3000);
    },
  },
};

const redisClient = redis.createClient(redisOptions);

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

redisClient.on("error", (err) => {
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on("end", () => {
  logger.warn("Redis client connection closed");
});

// Graceful shutdown
const gracefulShutdown = async () => {
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.info("Redis client disconnected gracefully");
    } catch (err) {
      logger.error(`Error during Redis client graceful shutdown: ${err.message}`);
    }
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = redisClient;
