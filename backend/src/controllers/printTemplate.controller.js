const PrintTemplate = require("../models/printTemplate.model");
const Laboratory = require("../models/laboratory.model");
const Patient = require("../models/patient.model");
const PatientTest = require("../models/patientTest.model");

// Helper to determine target lab ID based on request parameters or user role
const resolveLabId = async (req) => {
  // 1. Direct laboratoryId provided in query, body, headers, or req.laboratoryId
  const explicitLabId = req.query.laboratoryId || req.body?.laboratoryId || req.headers['x-laboratory-id'] || req.laboratoryId;
  if (explicitLabId) return explicitLabId;

  // 2. Resolve from patientId if provided
  const patientId = req.query.patientId || req.body?.patientId;
  if (patientId) {
    const patient = await Patient.findById(patientId).select("laboratoryId").lean();
    if (patient && patient.laboratoryId) {
      return patient.laboratoryId.toString();
    }
  }

  // 3. Resolve from reportId if provided
  const reportId = req.query.reportId || req.body?.reportId;
  if (reportId) {
    const report = await PatientTest.findById(reportId).select("laboratoryId patientId").lean();
    if (report && report.laboratoryId) {
      return report.laboratoryId.toString();
    }
    if (report && report.patientId) {
      const patient = await Patient.findById(report.patientId).select("laboratoryId").lean();
      if (patient && patient.laboratoryId) {
        return patient.laboratoryId.toString();
      }
    }
  }

  // 4. Authenticated user's laboratoryId (for regular lab staff)
  if (req.user && req.user.laboratoryId) {
    return req.user.laboratoryId.toString();
  }

  // 5. Fallback for system admin managing settings when no specific lab/patient/report parameter is supplied
  if (req.user && req.user.role === 'system_admin') {
    const defaultLab = await Laboratory.findOne({ status: { $ne: 'inactive' } }).select("_id").lean();
    if (defaultLab) {
      return defaultLab._id.toString();
    }
  }

  return null;
};

exports.getTemplate = async (req, res, next) => {
  try {
    let labId = await resolveLabId(req);

    if (!labId) {
      let template = new PrintTemplate({ userId: req.user._id });
      return res.status(200).json({ success: true, data: template });
    }

    let template = await PrintTemplate.findOne({ laboratoryId: labId });

    if (!template) {
      try {
        template = await PrintTemplate.create({ laboratoryId: labId, userId: req.user._id });
      } catch (createErr) {
        if (createErr.code === 11000) {
          template = await PrintTemplate.findOne({ laboratoryId: labId });
        } else {
          throw createErr;
        }
      }
    }

    if (!template) {
      template = new PrintTemplate({ laboratoryId: labId, userId: req.user._id });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { page, typography, elements, signatures } = req.body;
    let labId = await resolveLabId(req);

    if (!labId) {
      return res.status(400).json({ success: false, message: 'Laboratory ID required' });
    }
    
    const template = await PrintTemplate.findOneAndUpdate(
      { laboratoryId: labId },
      { page, typography, elements, signatures, laboratoryId: labId, userId: req.user._id },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.resetTemplate = async (req, res, next) => {
  try {
    let labId = await resolveLabId(req);

    if (!labId) {
      return res.status(400).json({ success: false, message: 'Laboratory ID required' });
    }

    await PrintTemplate.findOneAndDelete({ laboratoryId: labId });
    const template = await PrintTemplate.create({ laboratoryId: labId, userId: req.user._id });

    res.status(200).json({ success: true, data: template, message: "Template reset to defaults" });
  } catch (error) {
    next(error);
  }
};

