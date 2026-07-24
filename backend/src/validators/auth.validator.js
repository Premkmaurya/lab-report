const { body, param } = require("express-validator");

/**
 * Signup Validator
 * Validates: username, email, password
 */
const validateSignup = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

/**
 * Login Validator
 * Validates: identifier (username or email), password
 */
const validateLogin = [
  body("identifier")
    .optional()
    .trim(),

  body("username")
    .optional()
    .trim(),
  
  body("email")
    .optional()
    .trim(),
  
  body()
    .custom((value, { req }) => {
      const raw = req.body.identifier || req.body.username || req.body.email;
      if (!raw || !String(raw).trim()) {
        throw new Error("Please provide username or email");
      }
      return true;
    }),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * Create User Validator (Admin)
 * Validates: username, email, password, role
 */
const validateCreateUser = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
    
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array")
    .custom((value) => {
      if (value && value.includes('create_user')) {
        throw new Error("'create_user' permission cannot be assigned");
      }
      return true;
    }),
];

/**
 * Update User Status Validator (Admin)
 * Validates: id (MongoDB ObjectId), isAuthorized
 */
const validateUpdateUserStatus = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID format"),
  
  body("isAuthorized")
    .isBoolean()
    .withMessage("isAuthorized must be a boolean value"),
];

module.exports = {
  validateSignup,
  validateLogin,
  validateCreateUser,
  validateUpdateUserStatus,
};
