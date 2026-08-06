const express = require("express");

const {
  signup,
  login,
  logout,
  changePassword,
  getMe,
  createUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateSignup,
  validateLogin,
  validateCreateUser,
  validateUpdateUserStatus,
} = require("../validators/auth.validator");
const validateRequest = require("../validators/validationMiddleware");

const { injectTenantFilter, injectTenantOnCreate } = require("../middlewares/tenant.middleware");

const router = express.Router();

router.post(
  "/signup",
  validateSignup,
  validateRequest,
  signup,
);
router.post(
  "/login",
  validateLogin,
  validateRequest,
  login,
);
router.post("/logout", logout);
router.post(
  "/change-password",
  authMiddleware.userAuth,
  changePassword,
);
router.get("/me", authMiddleware.userAuth, getMe);

// Admin / System Admin user management routes
router.post(
  "/users",
  authMiddleware.userAuth,
  injectTenantFilter,
  injectTenantOnCreate,
  authMiddleware.authorizeRoles("admin"),
  validateCreateUser,
  validateRequest,
  createUser,
);
router.get(
  "/users",
  authMiddleware.userAuth,
  injectTenantFilter,
  authMiddleware.authorizeRoles("admin"),
  getAllUsers,
);
router.get(
  "/users/:id",
  authMiddleware.userAuth,
  injectTenantFilter,
  authMiddleware.authorizeRoles("admin"),
  getUserById,
);
router.patch(
  "/users/:id/status",
  authMiddleware.userAuth,
  injectTenantFilter,
  authMiddleware.authorizeRoles("admin"),
  validateUpdateUserStatus,
  validateRequest,
  updateUserStatus,
);

module.exports = router;
