const mongoose = require("mongoose");
const os = require("os");

const getHealthStatus = (req, res) => {
  // DB Connection status
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
    },
    system: {
      memoryUsage: process.memoryUsage(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpuLoad: os.loadavg(),
    }
  };

  // If DB is disconnected, returning 503 Service Unavailable might be preferred in some orchestrators
  // but for now, we just return the status.
  const httpStatus = dbStatus === "connected" ? 200 : 503;

  res.status(httpStatus).json(healthData);
};

module.exports = {
  getHealthStatus,
};
