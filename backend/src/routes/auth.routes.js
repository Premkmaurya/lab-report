const express = require("express");
const { authLimiter, apiLimiter } = require("../middlewares/rateLimit");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  signup,
  login,
  logout,
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

const router = express.Router();

router.post(
  "/signup",
  validateSignup,
  validateRequest,
  auditMiddleware("CREATED", "Auth"),
  signup,
);
router.post(
  "/login",
  authLimiter,
  validateLogin,
  validateRequest,
  auditMiddleware("LOGIN", "Auth"),
  login,
);
router.post("/logout", auditMiddleware("LOGOUT", "Auth"), logout);
router.get("/me", authMiddleware.userAuth, getMe);

// Admin routes
router.post(
  "/users",
  apiLimiter,
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  validateCreateUser,
  validateRequest,
  auditMiddleware("CREATED", "User"),
  createUser,
);
router.get(
  "/users",
  apiLimiter,
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  getAllUsers,
);
router.get(
  "/users/:id",
  apiLimiter,
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  getUserById,
);
router.patch(
  "/users/:id/status",
  apiLimiter,
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  validateUpdateUserStatus,
  validateRequest,
  auditMiddleware("UPDATED", "User"),
  updateUserStatus,
);

module.exports = router;
