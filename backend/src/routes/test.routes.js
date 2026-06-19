const express = require("express");
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} = require("../controllers/test.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateCreateTest,
  validateUpdateTest,
  validateGetTestById,
  validateDeleteTest,
} = require("../validators/test.validator");
const validateRequest = require("../validators/validationMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware.userAuth);

// Get all tests
router.get("/", getTests);

// Get test by ID
router.get(
  "/:id",
  validateGetTestById,
  validateRequest,
  getTestById,
);

// Create test
router.post(
  "/",
  authMiddleware.authorizeRoles("admin"),
  validateCreateTest,
  validateRequest,
  createTest
);

// Update test
router.patch(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  validateUpdateTest,
  validateRequest,
  updateTest
);

// Delete test
router.delete(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  validateDeleteTest,
  validateRequest,
  deleteTest
);

module.exports = router;
