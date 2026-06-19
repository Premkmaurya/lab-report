const express = require("express");
const {
  getPatientTests,
  getPatientTestById,
  getTestsByPatientId,
  createPatientTest,
  updatePatientTest,
  deletePatientTest,
} = require("../controllers/patientTest.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateCreatePatientTest,
  validateUpdatePatientTest,
  validateGetPatientTestById,
  validateGetTestsByPatientId,
  validateDeletePatientTest,
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

module.exports = router;
