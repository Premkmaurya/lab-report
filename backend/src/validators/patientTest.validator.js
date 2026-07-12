const { body, param } = require("express-validator");

/**
 * Create PatientTest Validator
 * Validates: patientId, tests array with testId, testName, and result details
 */
const validateCreatePatientTest = [
  body("patientId")
    .isMongoId()
    .withMessage("Invalid patient ID format"),
  
  body("tests")
    .isArray({ min: 1 })
    .withMessage("Tests array must contain at least one test"),
  
  body("tests.*.testId")
    .isMongoId()
    .withMessage("Each test must have a valid testId (MongoDB ObjectId)"),
  
  body("tests.*.testName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
  
  body("tests.*.result")
    .optional()
    .isArray()
    .withMessage("Result must be an array"),
  
  body("tests.*.result.*.parameter")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Parameter must not exceed 100 characters"),
  
  body("tests.*.result.*.value")
    .optional()
    .trim()
    .isLength({ min: 0, max: 100 })
    .withMessage("Value must not exceed 100 characters"),
  
  body("tests.*.result.*.unit")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Unit must not exceed 50 characters"),
  
  body("tests.*.result.*.normalRange")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Normal range must not exceed 100 characters"),
  
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD or ISO string)"),
];

/**
 * Update PatientTest Validator
 * Validates: id (MongoDB ObjectId), tests array, date
 */
const validateUpdatePatientTest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
  
  body("tests")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Tests array must contain at least one test"),
  
  body("tests.*.testId")
    .optional()
    .isMongoId()
    .withMessage("Each test must have a valid testId (MongoDB ObjectId)"),
  
  body("tests.*.testName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
  
  body("tests.*.result")
    .optional()
    .isArray()
    .withMessage("Result must be an array"),
  
  body("tests.*.result.*.parameter")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Parameter must not exceed 100 characters"),
  
  body("tests.*.result.*.value")
    .optional()
    .trim()
    .isLength({ min: 0, max: 100 })
    .withMessage("Value must not exceed 100 characters"),
  
  body("tests.*.result.*.unit")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Unit must not exceed 50 characters"),
  
  body("tests.*.result.*.normalRange")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Normal range must not exceed 100 characters"),
  
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

/**
 * Add Test to Existing Report Validator
 * Validates: id, testId, testName
 */
const validateAddTestToReport = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
  
  body("testId")
    .isMongoId()
    .withMessage("Valid testId (MongoDB ObjectId) is required"),
    
  body("testName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
];

/**
 * Get Report and Test Template Validator
 * Validates: id, testId (MongoDB ObjectIds)
 */
const validateGetReportAndTestTemplate = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient test ID format"),
  
  param("testId")
    .isMongoId()
    .withMessage("Invalid test ID format"),
];

module.exports = {
  validateCreatePatientTest,
  validateUpdatePatientTest,
  validateGetPatientTestById,
  validateGetTestsByPatientId,
  validateDeletePatientTest,
  validateAddTestToReport,
  validateGetReportAndTestTemplate,
};
