const PatientTest = require("../models/patientTest.model");
const Patient = require("../models/patient.model");
const Laboratory = require("../models/laboratory.model");
const LabDetails = require("../models/labDetails.model");
const PrintTemplate = require("../models/printTemplate.model");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

/**
 * Ensures a PatientTest has a verification token.
 */
const ensureVerificationToken = async (patientTest) => {
  if (!patientTest.verificationToken) {
    patientTest.verificationToken = crypto.randomBytes(32).toString("hex");
    await patientTest.save();
  }
  return patientTest.verificationToken;
};

/**
 * Verify patient credentials against patient model.
 */
const verifyPatientMatch = (patient, input) => {
  if (!input || !patient) return false;
  const cleanInput = String(input).trim().toLowerCase();
  
  // Check Mobile Phone
  if (patient.phone && String(patient.phone).trim().toLowerCase() === cleanInput) {
    return true;
  }
  // Check Visit ID
  if (patient.visitId && String(patient.visitId).trim().toLowerCase() === cleanInput) {
    return true;
  }
  // Check Visit Number
  if (patient.visitNumber && String(patient.visitNumber).trim().toLowerCase() === cleanInput) {
    return true;
  }
  // Check Date of Birth (YYYY-MM-DD or DD/MM/YYYY or ISO string)
  if (patient.dob) {
    const dobStr = new Date(patient.dob).toISOString().split("T")[0];
    if (dobStr === cleanInput) return true;
    const formattedDob = new Date(patient.dob).toLocaleDateString("en-GB"); // DD/MM/YYYY
    if (formattedDob === cleanInput) return true;
  }

  return false;
};

/**
 * Get sanitized public report data by verification token.
 */
const getPublicReportByToken = async (token, patientVerificationInput, req) => {
  const patientTest = await PatientTest.findOne({ verificationToken: token })
    .populate("patientId")
    .populate({
      path: "tests.testId",
      populate: { path: "departmentId", select: "name" },
    });

  if (!patientTest || patientTest.deleted) {
    return { error: "Invalid or expired report.", statusCode: 404 };
  }

  if (patientTest.verificationEnabled === false) {
    return { error: "Report verification is disabled for this report.", statusCode: 403 };
  }

  const patient = patientTest.patientId;
  if (!patient) {
    return { error: "Patient record not found for this report.", statusCode: 404 };
  }

  // Fetch laboratory info
  const labId = patientTest.laboratoryId || patient.laboratoryId;
  let labDoc = null;
  if (labId) {
    labDoc = await Laboratory.findById(labId).lean();
  }
  let labDetailsDoc = null;
  if (labId) {
    labDetailsDoc = await LabDetails.findOne({ laboratoryId: labId }).lean();
  }

  const requirePatientVerification = !!(
    labDetailsDoc?.requirePatientVerification || labDoc?.settings?.requirePatientVerification
  );

  // If patient verification is required and input is not yet verified
  if (requirePatientVerification && !patientVerificationInput) {
    return {
      requirePatientVerification: true,
      verificationRequired: true,
      message: "Patient verification is required to view this report.",
    };
  }

  if (requirePatientVerification && patientVerificationInput) {
    const isMatched = verifyPatientMatch(patient, patientVerificationInput);
    if (!isMatched) {
      return {
        requirePatientVerification: true,
        verificationFailed: true,
        error: "Patient verification failed. Details do not match our records.",
        statusCode: 400,
      };
    }
  }



  // Sanitize public response without internal IDs
  const sanitizedReport = {
    verificationToken: patientTest.verificationToken,
    status: patientTest.status || (patientTest.deleted ? "Deleted" : "Verified"),
    verifiedAt: patientTest.verifiedAt || patientTest.createdAt,
    laboratoryName: labDetailsDoc?.laboratoryDisplayName || labDoc?.name || "Laboratory",
    laboratoryAddress: labDetailsDoc?.letterheadAddressLine || labDoc?.address || "",
    laboratoryPhone: labDetailsDoc?.contactPhone || labDoc?.phone || "",
    laboratoryEmail: labDetailsDoc?.contactEmail || labDoc?.email || "",
    patientName: patient.name || "N/A",
    visitId: patient.visitId || "N/A",
    visitNumber: patient.visitNumber || "",
    reportId: patientTest.verificationToken.substring(0, 12).toUpperCase(),
    age: patient.age ? `${patient.age} Yrs` : "N/A",
    gender: patient.gender || "N/A",
    doctor: patient.referredDoctor || "Self / General",
    registrationDate: patient.registeredAt || patient.createdAt || patientTest.createdAt,
    reportDate: patientTest.date || patientTest.createdAt,
    generatedTime: patientTest.createdAt,
    tests: (patientTest.tests || []).map((t) => ({
      testName: t.testName,
      department: t.testId?.departmentId?.name || "GENERAL",
      result: (t.result || []).map((r) => ({
        parameter: r.parameter,
        type: r.type || "parameter",
        value: r.value || "",
        unit: r.unit || "",
        normalRange: r.normalRange || "",
        isTextBlock: !!r.isTextBlock,
        textBlockValue: r.textBlockValue || "",
        isListParameter: !!r.isListParameter,
      })),
    })),
  };

  return { success: true, report: sanitizedReport };
};

/**
 * Generate PDF buffer on demand for public download.
 */
const generateReportPDF = async (token, req) => {
  const patientTest = await PatientTest.findOne({ verificationToken: token })
    .populate("patientId")
    .populate({
      path: "tests.testId",
      populate: { path: "departmentId", select: "name" },
    });

  if (!patientTest || patientTest.deleted || patientTest.verificationEnabled === false) {
    throw new Error("Invalid or expired report.");
  }

  const patient = patientTest.patientId;
  const labId = patientTest.laboratoryId || patient?.laboratoryId;

  let labDetailsDoc = null;
  let labDoc = null;
  let printTemplateDoc = null;

  if (labId) {
    labDoc = await Laboratory.findById(labId).lean();
    labDetailsDoc = await LabDetails.findOne({ laboratoryId: labId }).lean();
    printTemplateDoc = await PrintTemplate.findOne({ laboratoryId: labId }).lean();
  }



  // Generate QR Data URL
  const domain = process.env.FRONTEND_URL || (req ? `${req.protocol}://${req.get("host")}` : "http://localhost:5173");
  const verifyUrl = `${domain.replace(/\/$/, "")}/report/verify/${token}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const labName = labDetailsDoc?.laboratoryDisplayName || labDoc?.name || "LABORATORY REPORT";
      const labAddress = labDetailsDoc?.letterheadAddressLine || labDoc?.address || "";
      const labPhone = labDetailsDoc?.contactPhone || labDoc?.phone || "";
      const labEmail = labDetailsDoc?.contactEmail || labDoc?.email || "";

      // Header: Lab Info
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text(labName, 40, 40);
      doc.fontSize(9).font("Helvetica").fillColor("#475569").text(labAddress);
      if (labPhone || labEmail) {
        doc.text(`Phone: ${labPhone} | Email: ${labEmail}`);
      }
      doc.moveDown(0.5);

      // Horizontal Divider
      doc.moveTo(40, 135).lineTo(555, 135).strokeColor("#CBD5E1").lineWidth(1).stroke();

      // Patient Details Box
      doc.rect(40, 145, 515, 65).fillAndStroke("#F8FAFC", "#E2E8F0");
      doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold");

      doc.text(`Patient Name: `, 50, 153, { continued: true })
         .font("Helvetica").text(patient?.name || "N/A");
      doc.font("Helvetica-Bold").text(`Visit ID: `, 320, 153, { continued: true })
         .font("Helvetica").text(patient?.visitId || "N/A");

      doc.font("Helvetica-Bold").text(`Age / Gender: `, 50, 170, { continued: true })
         .font("Helvetica").text(`${patient?.age ? patient.age + " Yrs" : "N/A"} / ${patient?.gender || "N/A"}`);
      doc.font("Helvetica-Bold").text(`Reg. Date: `, 320, 170, { continued: true })
         .font("Helvetica").text(new Date(patient?.registeredAt || patientTest.createdAt).toLocaleDateString());

      doc.font("Helvetica-Bold").text(`Ref. Doctor: `, 50, 187, { continued: true })
         .font("Helvetica").text(patient?.referredDoctor || "Self");
      doc.font("Helvetica-Bold").text(`Report Date: `, 320, 187, { continued: true })
         .font("Helvetica").text(new Date(patientTest.date || patientTest.createdAt).toLocaleDateString());

      // Test Table Header
      let y = 225;
      doc.rect(40, y, 515, 22).fill("#0F172A");
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
      doc.text("TEST PARAMETER", 50, y + 6);
      doc.text("RESULT", 260, y + 6);
      doc.text("UNIT", 360, y + 6);
      doc.text("REFERENCE RANGE", 440, y + 6);

      y += 26;

      // Render Tests & Parameters
      (patientTest.tests || []).forEach((t) => {
        // Test Heading
        if (y > 670) {
          doc.addPage();
          y = 40;
        }

        doc.rect(40, y, 515, 18).fill("#F1F5F9");
        doc.fillColor("#1E293B").fontSize(9).font("Helvetica-Bold").text(t.testName.toUpperCase(), 50, y + 4);
        y += 22;

        (t.result || []).forEach((r) => {
          if (y > 680) {
            doc.addPage();
            y = 40;
          }

          if (r.type === "section") {
            doc.fillColor("#334155").fontSize(8.5).font("Helvetica-Bold").text(r.parameter.toUpperCase(), 50, y);
            y += 16;
            return;
          }

          if (r.isTextBlock) {
            doc.fillColor("#334155").fontSize(8.5).font("Helvetica-Bold").text(r.parameter || "Remarks", 50, y);
            y += 12;
            doc.fillColor("#0F172A").fontSize(8.5).font("Helvetica").text(r.textBlockValue || r.value || "-", 50, y, { width: 500 });
            y += 20;
            return;
          }

          doc.fillColor("#1E293B").fontSize(8.5).font("Helvetica").text(r.parameter || "-", 50, y, { width: 200 });
          doc.fillColor("#000000").font("Helvetica-Bold").text(r.value || "-", 260, y, { width: 90 });
          doc.fillColor("#475569").font("Helvetica").text(r.unit || "", 360, y, { width: 70 });
          doc.fillColor("#475569").font("Helvetica").text(r.normalRange || "", 440, y, { width: 110 });

          y += 18;
        });

        y += 6;
      });

      // Verification Badge & Signatures at bottom
      if (y > 680) {
        doc.addPage();
        y = 50;
      } else {
        y = Math.max(y + 20, 680);
      }

      doc.moveTo(40, y).lineTo(555, y).strokeColor("#E2E8F0").lineWidth(1).stroke();
      y += 12;

      // Left: Technician Signature Block
      doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold").text("System Admin", 40, y + 25);
      doc.font("Helvetica").fontSize(8).fillColor("#64748B").text("Lab Technician", 40, y + 37);

      // Center: QR Code (70x70) & Label "Scan to Verify Report"
      const qrSize = 70;
      const qrX = Math.round((595.28 - qrSize) / 2); // Perfectly centered on A4 (595.28 width)
      doc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155").text("Scan to Verify Report", 40, y + qrSize + 2, { width: 515, align: "center" });

      // Right: Pathologist Signature Block
      doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold").text("Pathologist", 400, y + 25, { width: 155, align: "right" });
      doc.font("Helvetica").fontSize(8).fillColor("#64748B").text("Authorized Signatory", 400, y + 37, { width: 155, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  ensureVerificationToken,
  getPublicReportByToken,
  generateReportPDF,
};
