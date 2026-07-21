const express = require("express");
const { getLabDetails, createOrUpdateLabDetails, deleteLabDetails } = require("../controllers/labDetails.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const { injectTenantFilter } = require("../middlewares/tenant.middleware");

const router = express.Router();

router.use(userAuth, injectTenantFilter);

// Get the current user's lab details
router.get("/", cacheMiddleware(86400, (req) => `settings:lab-details:${req.laboratoryId || req.user.laboratoryId || req.user._id}`), getLabDetails);

// Create or update (upsert) current user's lab details
router.put("/", createOrUpdateLabDetails);

// Delete current user's lab details
router.delete("/", deleteLabDetails);

module.exports = router;
