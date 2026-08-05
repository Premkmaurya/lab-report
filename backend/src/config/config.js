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

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || 6379;
    const username = process.env.REDIS_USERNAME ? encodeURIComponent(process.env.REDIS_USERNAME) : "";
    const password = process.env.REDIS_PASSWORD ? encodeURIComponent(process.env.REDIS_PASSWORD) : "";
    const auth = username || password ? `${username}:${password}@` : "";
    return `redis://${auth}${host}:${port}`;
  }
  return "redis://localhost:6379";
};

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/report-generator",
  JWT_SECRET: process.env.JWT_SECRET,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  REDIS_URL: getRedisUrl(),
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME || "",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
};

module.exports = config;
