const dotenv = require('dotenv');

dotenv.config();


const _config = {
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/report-generator',
    JWT_SECRET: process.env.JWT_SECRET,
}


module.exports = _config;