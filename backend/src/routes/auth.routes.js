const express = require("express");

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
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  validateCreateUser,
  validateRequest,
  auditMiddleware("CREATED", "User"),
  createUser,
);
router.get(
  "/users",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  getAllUsers,
);
router.get(
  "/users/:id",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  getUserById,
);
router.patch(
  "/users/:id/status",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  validateUpdateUserStatus,
  validateRequest,
  auditMiddleware("UPDATED", "User"),
  updateUserStatus,
);

module.exports = router;
