const express = require("express");
const { getTemplate, updateTemplate, resetTemplate } = require("../controllers/printTemplate.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// Allow authenticated users to fetch the template (needed for printing reports)
router.get("/", userAuth, getTemplate);

// Only admins can update or reset the template
router.put("/", userAuth, authorizeRoles("admin"), updateTemplate);
router.post("/reset", userAuth, authorizeRoles("admin"), resetTemplate);

module.exports = router;
