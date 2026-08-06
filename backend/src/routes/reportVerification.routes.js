const express = require("express");
const router = express.Router();
const reportVerificationController = require("../controllers/reportVerification.controller");

// Public routes (no auth required)
router.get("/:token", reportVerificationController.verifyReport);
router.post("/:token/verify-patient", reportVerificationController.verifyPatientChallenge);
router.get("/:token/pdf", reportVerificationController.downloadReportPDF);

module.exports = router;
