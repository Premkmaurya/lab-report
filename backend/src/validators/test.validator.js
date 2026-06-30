const { body, param } = require("express-validator");

/**
 * Create Test Validator (Admin)
 * Validates: name, price
 */
const validateCreateTest = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),

  body("departmentId")
    .isMongoId()
    .withMessage("Invalid department ID format"),
  
  body("price")
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Price must be a number between 0 and 1,000,000"),
];

/**
 * Update Test Validator (Admin)
 * Validates: id (MongoDB ObjectId), name, price
 */
const validateUpdateTest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid test ID format"),
  
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test name must be between 1 and 100 characters"),
  
  body("departmentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid department ID format"),
  
  body("price")
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Price must be a number between 0 and 1,000,000"),
];

/**
 * Get Test by ID Validator
 * Validates: id (MongoDB ObjectId)
 */
const validateGetTestById = [
  param("id")
    .isMongoId()
    .withMessage("Invalid test ID format"),
];

/**
 * Delete Test Validator (Admin)
 * Validates: id (MongoDB ObjectId)
 */
const validateDeleteTest = [
  param("id")
    .isMongoId()
    .withMessage("Invalid test ID format"),
];

module.exports = {
  validateCreateTest,
  validateUpdateTest,
  validateGetTestById,
  validateDeleteTest,
};
