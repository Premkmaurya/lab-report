const express = require("express");
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
  authMiddleware.authorizeRoles("admin"),
  upload.single("signature"),
  validateCreateDoctor,
  validateRequest,
  createDoctor,
);
router.patch(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  upload.single("signature"),
  validateUpdateDoctor,
  validateRequest,
  updateDoctor,
);
router.delete(
  "/:id",
  authMiddleware.authorizeRoles("admin"),
  validateDeleteDoctor,
  validateRequest,
  deleteDoctor,
);

module.exports = router;
