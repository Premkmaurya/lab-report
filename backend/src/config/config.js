const dotenv = require("dotenv");

dotenv.config();

const _config = {
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/report-generator",
  JWT_SECRET: process.env.JWT_SECRET,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
};

module.exports = _config;
