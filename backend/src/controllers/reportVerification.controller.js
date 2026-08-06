const asyncHandler = require("../utils/asyncHandler");
const reportVerificationService = require("../services/reportVerification.service");

/**
 * Public Endpoint: GET /api/report/verify/:token
 * Fetches public report verification data by token.
 */
const verifyReport = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { verificationInput } = req.query;

  const result = await reportVerificationService.getPublicReportByToken(
    token,
    verificationInput,
    req
  );

  if (result.error) {
    return res.status(result.statusCode || 400).json({
      success: false,
      message: result.error,
      requirePatientVerification: result.requirePatientVerification || false,
    });
  }

  if (result.requirePatientVerification) {
    return res.status(200).json({
      success: true,
      requirePatientVerification: true,
      verificationRequired: true,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Public Endpoint: POST /api/report/verify/:token/verify-patient
 * Challenge patient verification with mobile, DOB, or visit ID.
 */
const verifyPatientChallenge = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { patientVerificationInput } = req.body;

  if (!patientVerificationInput) {
    return res.status(400).json({
      success: false,
      message: "Please enter Mobile Number, Date of Birth, or Visit ID.",
    });
  }

  const result = await reportVerificationService.getPublicReportByToken(
    token,
    patientVerificationInput,
    req
  );

  if (result.error || result.verificationFailed) {
    return res.status(result.statusCode || 400).json({
      success: false,
      message: result.error || "Patient verification failed.",
      requirePatientVerification: true,
    });
  }

  return res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Public Endpoint: GET /api/report/verify/:token/pdf
 * Generates and downloads the official PDF for a report.
 */
const downloadReportPDF = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const pdfBuffer = await reportVerificationService.generateReportPDF(token, req);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Report-Verification-${token.substring(0, 8)}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || "Unable to generate report PDF.",
    });
  }
});

module.exports = {
  verifyReport,
  verifyPatientChallenge,
  downloadReportPDF,
};
