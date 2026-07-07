const express = require("express");
const Doctor = require("../models/doctor.model");
const auditMiddleware = require("../middlewares/audit.middleware");
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
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateGetDoctorById,
  validateDeleteDoctor,
} = require("../validators/doctor.validator");
const validateRequest = require("../validators/validationMiddleware");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware.userAuth);

router.get("/", getAllDoctors);
router.get(
  "/:id",
  validateGetDoctorById,
  validateRequest,
  getDoctorById,
);

router.post(
  "/",
  authMiddleware.authorizePermissions("manage_doctors"),
  upload.single("signature"),
  validateCreateDoctor,
  validateRequest,
  auditMiddleware("CREATED", "Doctor"),
  createDoctor,
);
router.patch(
  "/:id",
  authMiddleware.authorizePermissions("manage_doctors"),
  authMiddleware.authorizeOwnership(Doctor),
  upload.single("signature"),
  validateUpdateDoctor,
  validateRequest,
  auditMiddleware("UPDATED", "Doctor"),
  updateDoctor,
);
router.delete(
  "/:id",
  authMiddleware.authorizePermissions("manage_doctors"),
  authMiddleware.authorizeOwnership(Doctor),
  validateDeleteDoctor,
  validateRequest,
  auditMiddleware("DELETED", "Doctor"),
  deleteDoctor,
);

module.exports = router;
