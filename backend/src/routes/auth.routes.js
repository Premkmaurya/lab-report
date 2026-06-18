const express = require("express");
const {
  signup,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware.userAuth, getMe);

module.exports = router;
