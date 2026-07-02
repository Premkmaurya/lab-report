const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  skipSuccessfulRequests: true, // Do not count successful logins
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    const ip = req.ip || req.connection.remoteAddress;
    const user = req.user ? req.user.id : "Unauthenticated";
    const role = req.user ? req.user.role : "None";
    
    // TODO: Integrate Winston logger here
    console.warn(
      `[RATE LIMIT EXCEEDED] Auth Limiter | Timestamp: ${new Date().toISOString()} | IP: ${ip} | User: ${user} | Role: ${role} | Method: ${req.method} | Route: ${req.originalUrl} | Reason: Exceeded 5 failed attempts in 15m`
    );

    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many failed login attempts. Please try again in 15 minutes.",
    });
  },
});

module.exports = authLimiter;
