const rateLimit = require("express-rate-limit");

const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: (req, res) => {
    if (req.user && req.user.role === "admin") {
      return 60;
    }
    if (req.user && req.user.role === "lab_technician") {
      return 40;
    }
    return 30; // Fallback
  },
  keyGenerator: (req, res) => {
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
      `[RATE LIMIT EXCEEDED] Report Limiter | Timestamp: ${new Date().toISOString()} | IP: ${ip} | User: ${user} | Role: ${role} | Method: ${req.method} | Route: ${req.originalUrl} | Reason: Exceeded ${options.limit} requests in 1m`
    );

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = reportLimiter;
