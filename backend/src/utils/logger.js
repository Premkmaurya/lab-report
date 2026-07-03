const winston = require("winston");
const path = require("path");
const config = require("../config/config");

const logDirectory = path.join(process.cwd(), "logs");

// Fields to redact from logs for security
const sensitiveKeys = ["password", "token", "jwt", "cookie", "authorization"];

const redactSensitiveData = winston.format((info) => {
  const clone = { ...info };

  // Recursive function to mask sensitive fields in objects
  const maskObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    
    const newObj = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          newObj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          newObj[key] = maskObject(obj[key]);
        } else {
          newObj[key] = obj[key];
        }
      }
    }
    return newObj;
  };

  // Mask metadata if it exists
  if (clone.meta) {
    clone.meta = maskObject(clone.meta);
  }

  // Mask message if it happens to be an object (edge case)
  if (typeof clone.message === "object") {
    clone.message = maskObject(clone.message);
  }

  return clone;
});

const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    redactSensitiveData(),
    winston.format.json()
  ),
  defaultMeta: { service: "laboratory-management-system" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "info.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDirectory, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDirectory, "exceptions.log"),
    }),
  ],
});

// If not in production, log to console as well
if (config.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}`;
          }
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

module.exports = logger;
