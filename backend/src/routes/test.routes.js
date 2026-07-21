const express = require("express");
const Test = require("../models/test.model");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} = require("../controllers/test.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");
const {
  validateCreateTest,
  validateUpdateTest,
  validateGetTestById,
  validateDeleteTest,
} = require("../validators/test.validator");
const validateRequest = require("../validators/validationMiddleware");

const { injectTenantFilter, injectTenantOnCreate } = require("../middlewares/tenant.middleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware.userAuth, injectTenantFilter);

// Get all tests
router.get("/", cacheMiddleware(86400, () => "tests:all"), getTests);

// Get test by ID
router.get(
  "/:id",
  validateGetTestById,
  validateRequest,
  cacheMiddleware(86400, (req) => `test:${req.params.id}`),
  getTestById,
);

// Create test
router.post(
  "/",
  injectTenantOnCreate,
  authMiddleware.authorizePermissions("manage_tests"),
  validateCreateTest,
  validateRequest,
  auditMiddleware("CREATED", "Test"),
  createTest
);

// Update test
router.patch(
  "/:id",
  authMiddleware.authorizePermissions("manage_tests"),
  authMiddleware.authorizeOwnership(Test),
  validateUpdateTest,
  validateRequest,
  auditMiddleware("UPDATED", "Test"),
  updateTest
);

// Delete test
router.delete(
  "/:id",
  authMiddleware.authorizePermissions("manage_tests"),
  authMiddleware.authorizeOwnership(Test),
  validateDeleteTest,
  validateRequest,
  auditMiddleware("DELETED", "Test"),
  deleteTest
);

module.exports = router;
