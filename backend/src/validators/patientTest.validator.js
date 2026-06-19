const { body, param } = require("express-validator");

/**
 * Create PatientTest Validator
 * Validates: patientId, test array with testId and testName
 */
const validateCreatePatientTest = [
  body("patientId")
    .isMongoId()
    .withMessage("Invalid patient ID format"),
  
  body("test")
    .isArray({ min: 1 })
    .withMessage("Test array must contain at least one test"),
  
  body("test.*.testId")
    .isMongoId()
    .withMessage("Each test must have a valid testId (MongoDB ObjectId)"),
  
  body("test.*.testName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
  
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD or ISO string)"),
];

/**
 * Update PatientTest Validator
 * Validates: id (MongoDB ObjectId), test array, date
 */
const validateUpdatePatientTest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
  
  body("test")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Test array must contain at least one test"),
  
  body("test.*.testId")
    .optional()
    .isMongoId()
    .withMessage("Each test must have a valid testId (MongoDB ObjectId)"),
  
  body("test.*.testName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
  
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD or ISO string)"),
];

/**
 * Get PatientTest by ID Validator
 * Validates: id (MongoDB ObjectId)
 */
const validateGetPatientTestById = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
];

/**
 * Get Tests by Patient ID Validator
 * Validates: patientId (MongoDB ObjectId)
 */
const validateGetTestsByPatientId = [
  param("patientId")
    .isMongoId()
    .withMessage("Invalid patient ID format"),
];

/**
 * Delete PatientTest Validator
 * Validates: id (MongoDB ObjectId)
 */
const validateDeletePatientTest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
];

module.exports = {
  validateCreatePatientTest,
  validateUpdatePatientTest,
  validateGetPatientTestById,
  validateGetTestsByPatientId,
  validateDeletePatientTest,
};
