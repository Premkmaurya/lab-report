const rateLimit = require("express-rate-limit");
const logger = require("../../utils/logger");

const printLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: (req, res) => {
    if (req.user && req.user.role === "admin") {
      return 20;
    }
    if (req.user && req.user.role === "lab_technician") {
      return 15;
    }
    return 10; // Fallback
  },
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) {
      return req.user.id;
    }
    return req["ip"] || req.connection.remoteAddress;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Print Rate Limit Exceeded - IP: ${req.ip}, User ID: ${req.user ? req.user.id : "Unauthenticated"}, Route: ${req.originalUrl}`);

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = printLimiter;
