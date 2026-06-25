const express = require("express");
const {
  getPatientTests,
  getPatientTestById,
  getTestsByPatientId,
  createPatientTest,
  updatePatientTest,
  deletePatientTest,
  addTestToReport,
  getReportAndTestTemplate,
} = require("../controllers/patientTest.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateCreatePatientTest,
  validateUpdatePatientTest,
  validateGetPatientTestById,
  validateGetTestsByPatientId,
  validateDeletePatientTest,
  validateAddTestToReport,
  validateGetReportAndTestTemplate,
} = require("../validators/patientTest.validator");
const validateRequest = require("../validators/validationMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware.userAuth);

// Get all patient tests
router.get("/", getPatientTests);

// Get tests by patient ID (must come before /:id route)
router.get(
  "/patient/:patientId",
  validateGetTestsByPatientId,
  validateRequest,
  getTestsByPatientId,
);

// Get patient test by ID
router.get(
  "/:id",
  validateGetPatientTestById,
  validateRequest,
  getPatientTestById,
);

// Get patient test and specific test template
router.get(
  "/:id/test/:testId",
  validateGetReportAndTestTemplate,
  validateRequest,
  getReportAndTestTemplate,
);

// Create patient test
router.post(
  "/",
  validateCreatePatientTest,
  validateRequest,
  createPatientTest
);

// Update patient test
router.patch(
  "/:id",
  validateUpdatePatientTest,
  validateRequest,
  updatePatientTest
);

// Delete patient test
router.delete(
  "/:id",
  validateDeletePatientTest,
  validateRequest,
  deletePatientTest
);

// Add test to existing report
router.patch(
  "/:id/add-test",
  validateAddTestToReport,
  validateRequest,
  addTestToReport
);

module.exports = router;
