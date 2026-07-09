const express = require("express");
const { getLabDetails, createOrUpdateLabDetails, deleteLabDetails } = require("../controllers/labDetails.controller");
const { userAuth, authorizeRoles } = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const router = express.Router();

router.use(userAuth);

// Get the current user's lab details
router.get("/", cacheMiddleware(86400, (req) => `settings:lab-details:${req.user._id}`), getLabDetails);

// Create or update (upsert) current user's lab details
router.put("/", createOrUpdateLabDetails);

// Delete current user's lab details
router.delete("/", deleteLabDetails);

module.exports = router;
