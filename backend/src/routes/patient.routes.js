const express = require("express");
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
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
  validateCreatePatient,
  validateRequest,
  createPatient
);

// Update patient
router.patch(
  "/:id",
  validateUpdatePatient,
  validateRequest,
  updatePatient
);

module.exports = router;
