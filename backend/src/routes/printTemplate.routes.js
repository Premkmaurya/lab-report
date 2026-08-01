const express = require("express");
const { getTemplate, updateTemplate, resetTemplate } = require("../controllers/printTemplate.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");

const { injectTenantFilter } = require("../middlewares/tenant.middleware");

const router = express.Router();

router.use(userAuth, injectTenantFilter);

// Allow authenticated users to fetch the template (needed for printing reports)
router.get("/", getTemplate);

// Users can manage their lab's template
router.patch("/", updateTemplate);
router.put("/", updateTemplate);
router.post("/reset", resetTemplate);

module.exports = router;
