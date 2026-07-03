const rateLimit = require("express-rate-limit");
const logger = require("../../utils/logger");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (req, res) => {
    // Determine limit based on role
    if (req.user && req.user.role === "admin") {
      return 200;
    }
    if (req.user && req.user.role === "lab_technician") {
      return 150;
    }
    return 100; // Fallback for unauthenticated or other roles
  },
  keyGenerator: (req, res) => {
    // If user is authenticated, use their ID as the key.
    // Otherwise, fallback to IP address.
    if (req.user && req.user.id) {
      return req.user.id;
    }
    return req["ip"] || req.connection.remoteAddress;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`API Rate Limit Exceeded - IP: ${req.ip}, User ID: ${req.user ? req.user.id : "Unauthenticated"}, Route: ${req.originalUrl}`);

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = apiLimiter;
