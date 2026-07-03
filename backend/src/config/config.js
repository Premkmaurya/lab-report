const dotenv = require("dotenv");

// Load .env file
dotenv.config();

// Required environment variables for production
const requiredEnvVars = [
  "JWT_SECRET",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "IMAGEKIT_PUBLIC_KEY",
];

// Validate only in production or if strictly needed
if (process.env.NODE_ENV === "production") {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment validation failed: Missing required variable ${envVar}`);
    }
  });
}

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/report-generator",
  JWT_SECRET: process.env.JWT_SECRET,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
};

module.exports = config;
