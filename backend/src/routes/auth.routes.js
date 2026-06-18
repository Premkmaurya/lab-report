const express = require("express");
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

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware.userAuth, getMe);

// Admin routes
router.post(
  "/users",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
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
  updateUserStatus,
);

module.exports = router;
