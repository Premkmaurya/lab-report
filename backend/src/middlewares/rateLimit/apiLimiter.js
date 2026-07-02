const rateLimit = require("express-rate-limit");

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
    return req.ip || req.connection.remoteAddress;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const ip = req.ip || req.connection.remoteAddress;
    const user = req.user ? req.user.id : "Unauthenticated";
    const role = req.user ? req.user.role : "None";
    
    // TODO: Integrate Winston logger here
    console.warn(
      `[RATE LIMIT EXCEEDED] API Limiter | Timestamp: ${new Date().toISOString()} | IP: ${ip} | User: ${user} | Role: ${role} | Method: ${req.method} | Route: ${req.originalUrl} | Reason: Exceeded ${options.limit} requests in 15m`
    );

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = apiLimiter;
