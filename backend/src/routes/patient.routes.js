const express = require("express");
const { reportLimiter } = require("../middlewares/rateLimit");
const auditMiddleware = require("../middlewares/audit.middleware");

const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientsSummary,
  exportPatientsSummary,
} = require("../controllers/patient.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const {
  validateCreatePatient,
  validateUpdatePatient,
  validateGetPatientById,
} = require("../validators/patient.validator");

const validateRequest = require("../validators/validationMiddleware");

const router = express.Router();

router.use(authMiddleware.userAuth);

// Get all patients
router.get("/", getPatients);

// Get patient summaries (Admin only)
router.get(
  "/summary/:period",
  authMiddleware.authorizeRoles("admin"),
  getPatientsSummary
);

// Export patient summaries as CSV (Admin only)
router.get(
  "/export/:period",
  authMiddleware.authorizeRoles("admin"),
  exportPatientsSummary
);



// Get patient by ID
router.get(
  "/:id",
  validateGetPatientById,
  validateRequest,
  getPatientById,
);

// Create patient
router.post(
  "/",
  reportLimiter,
  validateCreatePatient,
  validateRequest,
  auditMiddleware("CREATED", "Patient"),
  createPatient
);

// Update patient
router.patch(
  "/:id",
  reportLimiter,
  validateUpdatePatient,
  validateRequest,
  auditMiddleware("UPDATED", "Patient"),
  updatePatient
);

module.exports = router;
