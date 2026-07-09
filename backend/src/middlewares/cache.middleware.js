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

    try {
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        // Default key: Base URL + query params (sorted for determinism)
        const params = new URLSearchParams(req.query);
        params.sort();
        const queryStr = params.toString() ? `?${params.toString()}` : "";
        cacheKey = `route:${req.baseUrl}${req.path}${queryStr}`;
      }

      req.cacheKey = cacheKey; // Expose to controller if needed

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);

      // Overwrite res.json to cache the response before sending it
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
            logger.error(`Redis SetEx Error for key ${cacheKey}: ${err.message}`);
          });
        }
        originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`Cache Middleware Error: ${error.message}`);
      next(); // Continue using MongoDB on Redis failure
    }
  };
};

module.exports = cacheMiddleware;
