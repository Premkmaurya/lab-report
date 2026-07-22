const { body, param } = require("express-validator");

/**
 * Create Doctor Validator (Admin)
 * Validates: name, qualification, signature file
 */
const validateCreateDoctor = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Doctor name must be between 1 and 100 characters"),
  
  body("qualification")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Qualification must be between 1 and 100 characters"),
  
  body("laboratoryId")
    .if((value, { req }) => req.user?.role === "system_admin")
    .notEmpty()
    .withMessage("Laboratory selection is required for System Admin")
    .isMongoId()
    .withMessage("Invalid laboratory ID format"),
  
  // Note: File validation happens in controller (req.file check)
];

/**
 * Update Doctor Validator (Admin)
 * Validates: id (MongoDB ObjectId), name, qualification, isActive
 */
const validateUpdateDoctor = [
  param("id")
    .isMongoId()
    .withMessage("Invalid doctor ID format"),
  
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Doctor name must be between 1 and 100 characters"),
  
  body("qualification")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Qualification must be between 1 and 100 characters"),
  
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  
  body("laboratoryId")
    .optional()
    .if((value, { req }) => req.user?.role === "system_admin")
    .isMongoId()
    .withMessage("Invalid laboratory ID format"),
];

/**
 * Get Doctor by ID Validator
 * Validates: id (MongoDB ObjectId)
 */
const validateGetDoctorById = [
  param("id")
    .isMongoId()
    .withMessage("Invalid doctor ID format"),
];

/**
 * Delete Doctor Validator (Admin)
 * Validates: id (MongoDB ObjectId)
 */
const validateDeleteDoctor = [
  param("id")
    .isMongoId()
    .withMessage("Invalid doctor ID format"),
];

module.exports = {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateGetDoctorById,
  validateDeleteDoctor,
};
