const redisClient = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Invalidate a specific cache key
 * @param {string} key 
 */
const invalidateCacheKey = async (key) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(key);
    logger.debug(`Invalidated cache key: ${key}`);
  } catch (error) {
    logger.error(`Error invalidating cache key ${key}: ${error.message}`);
  }
};

/**
 * Invalidate all cache keys matching a pattern
 * Requires using SCAN to find keys, then DEL to remove them.
 * @param {string} pattern - E.g., "route:/api/tests*"
 */
const invalidateCachePattern = async (pattern) => {
  if (!redisClient.isReady) return;
  try {
    let cursor = 0;
    const keysToDelete = [];

    do {
      const reply = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = reply.cursor;
      keysToDelete.push(...reply.keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
      logger.debug(`Invalidated ${keysToDelete.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Error invalidating cache pattern ${pattern}: ${error.message}`);
  }
};

module.exports = {
  invalidateCacheKey,
  invalidateCachePattern
};
