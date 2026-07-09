require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");
const logger = require("./src/utils/logger");
const config = require("./src/config/config");
const redisClient = require("./src/config/redis");
const cron = require("node-cron");

connectDB();

// Initialize Redis Connection
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Initial Redis connection failed, cache disabled", err);
  }
})();

const PORT = config.PORT;

// Schedule database backup (Every day at 2:00 AM)
cron.schedule("0 2 * * *", () => {
  logger.info("Cron job triggered: Running daily database backup");
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.NODE_ENV} mode`);
});