const { body, param } = require("express-validator");

/**
 * Create Patient Validator
 * Validates: name, age, gender, referredDoctor, date
 */
const validateCreatePatient = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Patient name must be between 1 and 100 characters"),
  
  body("age")
    .isInt({ min: 1, max: 150 })
    .withMessage("Age must be a number between 1 and 150"),
  
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be 'male', 'female', or 'other'"),
  
  body("referredDoctor")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Referred doctor name must be between 1 and 100 characters"),
  
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD or ISO string)"),
];

/**
 * Update Patient Validator
 * Validates: id (MongoDB ObjectId), name, age, gender, referredDoctor, date
 */
const validateUpdatePatient = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient ID format"),
  
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Patient name must be between 1 and 100 characters"),
  
  body("age")
    .optional()
    .isInt({ min: 1, max: 150 })
    .withMessage("Age must be a number between 1 and 150"),
  
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be 'male', 'female', or 'other'"),
  
  body("referredDoctor")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Referred doctor name must be between 1 and 100 characters"),
  
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD or ISO string)"),
];

/**
 * Get Patient by ID Validator
 * Validates: id (MongoDB ObjectId)
 */
const validateGetPatientById = [
  param("id")
    .isMongoId()
    .withMessage("Invalid patient ID format"),
];

module.exports = {
  validateCreatePatient,
  validateUpdatePatient,
  validateGetPatientById,
};
