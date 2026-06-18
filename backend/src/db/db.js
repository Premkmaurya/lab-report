const mongoose = require('mongoose');
const config = require('../config/config');


const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;