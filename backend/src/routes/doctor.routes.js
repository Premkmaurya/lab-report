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

const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);


router.post(
  "/",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  upload.single("signature"),
  createDoctor,
);
router.patch(
  "/:id",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  upload.single("signature"),
  updateDoctor,
);
router.delete(
  "/:id",
  authMiddleware.userAuth,
  authMiddleware.authorizeRoles("admin"),
  deleteDoctor,
);

module.exports = router;
