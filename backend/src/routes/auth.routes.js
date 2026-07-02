const express = require("express");
const { authLimiter, apiLimiter } = require("../middlewares/rateLimit");
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

router.post("/signup", validateSignup, validateRequest, signup);
router.post("/login", authLimiter, validateLogin, validateRequest, login);
router.post("/logout", logout);
router.get("/me", authMiddleware.userAuth, getMe);

// Admin routes
router.post(
  "/users",
  apiLimiter,
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  validateCreateUser,
  validateRequest,
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
  updateUserStatus,
);

module.exports = router;
