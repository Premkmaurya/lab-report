const logger = require("../utils/logger");
const config = require("../config/config");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Set defaults if not provided
  statusCode = statusCode || 500;
  message = message || "Internal Server Error";

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    let value = "value";
    if (err.keyValue) {
      value = Object.values(err.keyValue).join(", ");
    } else if (err.errmsg) {
      const match = err.errmsg.match(/(["'])(\\?.)*?\1/);
      if (match && match[0]) {
        value = match[0];
      }
    }
    message = `Duplicate field value: ${value}. Please use another value.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = `Invalid input data. ${errors.join(". ")}`;
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  // Log error
  if (statusCode === 500) {
    logger.error("Unhandled Exception:", { error: err.message, stack: err.stack, route: req.originalUrl });
  } else {
    // For operational errors, we just log info/warn depending on verbosity needed.
    // Error logger is generally for 500s or unexpected issues.
    logger.warn(`Operational Error: ${message}`, { route: req.originalUrl, statusCode });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
