const express = require("express");
const Test = require("../models/test.model");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getGlobalTests,
  getGlobalTestById,
  createGlobalTest,
  updateGlobalTest,
  deleteGlobalTest,
  importGlobalTest,
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

// ==========================================
// GLOBAL TEST LIBRARY ROUTES
// ==========================================
router.get(
  "/global",
  cacheMiddleware(300, (req) => `tests:global:${req.query.search || ''}:${req.query.departmentId || ''}:${req.user.laboratoryId || req.query.laboratoryId || 'all'}`),
  getGlobalTests
);

router.get("/global/:id", getGlobalTestById);

router.post(
  "/global",
  authMiddleware.authorizeRoles("system_admin"),
  validateCreateTest,
  validateRequest,
  auditMiddleware("CREATED", "GlobalTest"),
  createGlobalTest
);

router.patch(
  "/global/:id",
  authMiddleware.authorizeRoles("system_admin"),
  validateUpdateTest,
  validateRequest,
  auditMiddleware("UPDATED", "GlobalTest"),
  updateGlobalTest
);

router.delete(
  "/global/:id",
  authMiddleware.authorizeRoles("system_admin"),
  validateDeleteTest,
  validateRequest,
  auditMiddleware("DELETED", "GlobalTest"),
  deleteGlobalTest
);

router.post(
  "/global/:id/import",
  authMiddleware.authorizePermissions("manage_tests"),
  auditMiddleware("IMPORTED", "Test"),
  importGlobalTest
);

// ==========================================
// LABORATORY CATALOG ROUTES
// ==========================================

// Get all tests for laboratory
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
