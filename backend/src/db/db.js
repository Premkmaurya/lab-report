const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config/config');


const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;