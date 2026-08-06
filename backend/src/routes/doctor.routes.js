const express = require("express");
const Doctor = require("../models/doctor.model");
const multer = require("multer");
const path = require("path");
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateGetDoctorById,
  validateDeleteDoctor,
} = require("../validators/doctor.validator");
const validateRequest = require("../validators/validationMiddleware");

const { injectTenantFilter, injectTenantOnCreate } = require("../middlewares/tenant.middleware");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware.userAuth, injectTenantFilter);

router.get("/", cacheMiddleware(86400, (req) => `doctors:${req.laboratoryId || req.tenantFilter?.laboratoryId || 'all'}`), getAllDoctors);
router.get(
  "/:id",
  validateGetDoctorById,
  validateRequest,
  cacheMiddleware(86400, (req) => `doctor:${req.params.id}`),
  getDoctorById,
);

router.post(
  "/",
  upload.single("signature"),
  injectTenantOnCreate,
  authMiddleware.authorizePermissions("manage_doctors"),
  validateCreateDoctor,
  validateRequest,
  createDoctor,
);
router.patch(
  "/:id",
  authMiddleware.authorizePermissions("manage_doctors"),
  authMiddleware.authorizeOwnership(Doctor),
  upload.single("signature"),
  validateUpdateDoctor,
  validateRequest,
  updateDoctor,
);
router.delete(
  "/:id",
  authMiddleware.authorizePermissions("manage_doctors"),
  authMiddleware.authorizeOwnership(Doctor),
  validateDeleteDoctor,
  validateRequest,
  deleteDoctor,
);

module.exports = router;
