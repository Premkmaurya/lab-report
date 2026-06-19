const { validationResult } = require("express-validator");

/**
 * Centralized validation error handling middleware
 * Formats and returns validation errors in a consistent response format
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

module.exports = validateRequest;
