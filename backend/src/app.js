const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const doctorRoutes = require("./routes/doctor.routes");
const patientRoutes = require("./routes/patient.routes");
const testRoutes = require("./routes/test.routes");
const patientTestRoutes = require("./routes/patientTest.routes");
const departmentRoutes = require("./routes/department.routes");
const healthRoutes = require("./routes/health.routes");
const printTemplateRoutes = require("./routes/printTemplate.routes");
const labDetailsRoutes = require("./routes/labDetails.routes");

const { userAuth, authorizeRoles } = require("./middlewares/auth.middleware");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/error.middleware");
const config = require("./config/config");
const statusMonitor = require("express-status-monitor");

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://lab-report-theta.vercel.app"],
    credentials: true,
  }),
);

// Pipe morgan HTTP logs to winston
const morganFormat = config.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Protect the /status route before initializing the monitor
app.use("/status", userAuth, authorizeRoles("admin"));
app.use(statusMonitor());

const laboratoryRoutes = require("./routes/laboratory.routes");

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes); // Auth routes have their own limiters
app.use("/api/laboratories", laboratoryRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/patient-tests", patientTestRoutes);
app.use("/api/settings/print-template", printTemplateRoutes);
app.use("/api/settings/lab-details", labDetailsRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

module.exports = app;
