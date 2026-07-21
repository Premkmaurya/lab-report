const redisClient = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Reusable cache middleware
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Optional function to generate a custom cache key
 */
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // If Redis is not connected, gracefully bypass the cache
    if (!redisClient.isReady) {
      return next();
    }

    let cacheKey;
    try {
      const tenantPrefix = req.user?.laboratoryId ? req.user.laboratoryId.toString() : 'global';
      if (keyGenerator) {
        cacheKey = `tenant:${tenantPrefix}:${keyGenerator(req)}`;
      } else {
        // Default key: Base URL + query params (sorted for determinism)
        const params = new URLSearchParams(req.query);
        params.sort();
        const queryStr = params.toString() ? `?${params.toString()}` : "";
        cacheKey = `tenant:${tenantPrefix}:route:${req.baseUrl}${req.path}${queryStr}`;
      }

      req.cacheKey = cacheKey; // Expose to controller if needed
    } catch (keyError) {
      logger.error(`Cache key generation error: ${keyError.message}`);
      return next();
    }

    // Isolate the Redis GET so a mid-reconnect error never propagates
    // as a 500 to the client — we simply fall through to the controller.
    let cachedData = null;
    try {
      cachedData = await redisClient.get(cacheKey);
    } catch (redisError) {
      logger.error(`Cache GET error for key ${cacheKey}: ${redisError.message}`);
      return next();
    }

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.data === null) {
          logger.warn(`Bypassing and clearing invalid null cache for key: ${cacheKey}`);
          redisClient.del(cacheKey).catch(() => {});
        } else {
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return res.status(200).json(parsed);
        }
      } catch (parseErr) {
        logger.error(`Cache parse error for key ${cacheKey}: ${parseErr.message}`);
        redisClient.del(cacheKey).catch(() => {});
      }
    }

    logger.debug(`Cache miss for key: ${cacheKey}`);

    // Overwrite res.json to cache the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses (status 200-299) that contain valid data
      if (res.statusCode >= 200 && res.statusCode < 300 && body && (body.data !== undefined && body.data !== null) && redisClient.isReady) {
        redisClient.setEx(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
          logger.error(`Redis SetEx Error for key ${cacheKey}: ${err.message}`);
        });
      }
      originalJson(body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
