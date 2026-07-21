const express = require("express");
const { getTemplate, updateTemplate, resetTemplate } = require("../controllers/printTemplate.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const { injectTenantFilter } = require("../middlewares/tenant.middleware");

const router = express.Router();

router.use(userAuth, injectTenantFilter);

// Allow authenticated users to fetch the template (needed for printing reports)
router.get(
  "/",
  cacheMiddleware(86400, (req) => `settings:print-template:${req.laboratoryId || req.user.laboratoryId || req.user._id}`),
  getTemplate
);

// Users can manage their lab's template
router.put("/", updateTemplate);
router.post("/reset", resetTemplate);

module.exports = router;
