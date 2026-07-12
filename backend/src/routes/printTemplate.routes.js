const express = require("express");
const { getTemplate, updateTemplate, resetTemplate } = require("../controllers/printTemplate.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const router = express.Router();

// Allow authenticated users to fetch the template (needed for printing reports)
router.get(
  "/",
  userAuth,
  cacheMiddleware(86400, (req) => `settings:print-template:${req.user._id}`),
  getTemplate
);

// Users can manage their own template
router.put("/", userAuth, authorizeRoles("admin","user"), updateTemplate);
router.post("/reset", userAuth, authorizeRoles("admin","user"), resetTemplate);

module.exports = router;
