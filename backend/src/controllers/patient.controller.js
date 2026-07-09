const Patient = require("../models/patient.model");
const PatientTest = require("../models/patientTest.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCachePattern } = require("../services/cache.service");

const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find()
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    patients,
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "createdBy",
    "username email",
  );

  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  res.status(200).json({
    success: true,
    patient,
  });
});

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  await patient.delete();

  await invalidateCachePattern("dashboard:stats:*");

  res.status(200).json({
    success: true,
    message: "Patient deleted successfully",
    patient,
  });
});

const createPatient = asyncHandler(async (req, res) => {
  const { name, age, gender, date, referredDoctor } = req.body;

  if (!name || !age || !gender || !referredDoctor) {
    throw new BadRequestError("Please provide name, age, gender, and referred doctor");
  }

  const patient = await Patient.create({
    name,
    age,
    gender,
    date: date || new Date(),
    referredDoctor,
    createdBy: req.user.id,
  });

  await invalidateCachePattern("dashboard:stats:*");

  res.status(201).json({
    success: true,
    patient,
  });
});

const updatePatient = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "age", "gender", "date", "referredDoctor"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Please provide at least one valid field to update");
  }

  const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    returnDocument: "after",
    runValidators: true,
  }).populate("createdBy", "name email");

  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  await invalidateCachePattern("dashboard:stats:*");

  res.status(200).json({
    success: true,
    patient,
  });
});

const getRange = (period, timezoneOffsetMinutes = 0) => {
  const tzOffset = parseInt(timezoneOffsetMinutes, 10) || 0;

  const now = new Date();
  // clientLocalTime represents the client's wall clock time as a Date object in UTC
  const clientLocalTime = new Date(now.getTime() - tzOffset * 60 * 1000);

  const start = new Date(clientLocalTime);
  const end = new Date(clientLocalTime);
  end.setUTCHours(23, 59, 59, 999);

  if (period === "today") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = start.getUTCDay();
    const diff = start.getUTCDate() - day; // get Sunday
    start.setUTCDate(diff);
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else {
    throw new BadRequestError("Invalid period type. Supported periods: today, week, month");
  }

  // Convert back to UTC to query the database
  const utcStart = new Date(start.getTime() + tzOffset * 60 * 1000);
  const utcEnd = new Date(end.getTime() + tzOffset * 60 * 1000);

  return { start: utcStart, end: utcEnd };
};

const getPatientsSummary = asyncHandler(async (req, res) => {
  const { period } = req.params;
  const { timezoneOffset } = req.query;

  if (!["today", "week", "month"].includes(period)) {
    throw new BadRequestError("Invalid period format");
  }

  const { start, end } = getRange(period, timezoneOffset);

  const patients = await Patient.find({
    date: { $gte: start, $lte: end },
  })
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 });

  const todayRange = getRange("today", timezoneOffset);
  const weekRange = getRange("week", timezoneOffset);
  const monthRange = getRange("month", timezoneOffset);

  const todayCount = await Patient.countDocuments({
    date: { $gte: todayRange.start, $lte: todayRange.end },
  });
  const weekCount = await Patient.countDocuments({
    date: { $gte: weekRange.start, $lte: weekRange.end },
  });
  const monthCount = await Patient.countDocuments({
    date: { $gte: monthRange.start, $lte: monthRange.end },
  });

  res.status(200).json({
    success: true,
    count: patients.length,
    patients,
    summary: {
      today: todayCount,
      week: weekCount,
      month: monthCount,
    },
  });
});

const exportPatientsSummary = asyncHandler(async (req, res) => {
  const { period } = req.params;
  const { timezoneOffset } = req.query;

  if (!["today", "week", "month"].includes(period)) {
    throw new BadRequestError("Invalid period format");
  }

  const { start, end } = getRange(period, timezoneOffset);

  const patients = await Patient.find({
    date: { $gte: start, $lte: end },
  }).sort({ createdAt: -1 });

  const todayRange = getRange("today", timezoneOffset);
  const weekRange = getRange("week", timezoneOffset);
  const monthRange = getRange("month", timezoneOffset);

  const todayCount = await Patient.countDocuments({
    date: { $gte: todayRange.start, $lte: todayRange.end },
  });
  const weekCount = await Patient.countDocuments({
    date: { $gte: weekRange.start, $lte: weekRange.end },
  });
  const monthCount = await Patient.countDocuments({
    date: { $gte: monthRange.start, $lte: monthRange.end },
  });

  // Generate CSV data
  let csv = "";
  if (period === "today") {
    csv += "Patient Registration Summary (Today)\n";
    csv += "Period,Count\n";
    csv += `Today,${todayCount}\n\n`;
  } else if (period === "week") {
    csv += "Patient Registration Summary (This Week)\n";
    csv += "Period,Count\n";
    csv += `This Week,${weekCount}\n\n`;
  } else if (period === "month") {
    csv += "Patient Registration Summary (This Month)\n";
    csv += "Period,Count\n";
    csv += `This Month,${monthCount}\n\n`;
  }

  csv +=
    "Patient ID,Patient Name,Age,Gender,Phone,Referred Doctor,Registration Date,Reports\n";

  for (const patient of patients) {
    // Find reports for the patient
    const reports = await PatientTest.find({ patientId: patient._id });
    const reportsString = reports
      .map((r) => {
        return r.tests
          .map((t) => {
            const results = t.result
              .map((res) => `${res.parameter || "Value"}: ${res.value}`)
              .join("; ");
            return `${t.testName} (${results})`;
          })
          .join("; ");
      })
      .join(" | ");

    const clean = (val) => {
      if (val === undefined || val === null) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"')
        ? `"${str}"`
        : str;
    };

    csv += `${clean(patient._id)},${clean(patient.name)},${clean(patient.age)},${clean(
      patient.gender,
    )},"N/A",${clean(patient.referredDoctor)},${clean(
      patient.createdAt.toISOString(),
    )},${clean(reportsString)}\n`;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=patient_summary_${period}_${
      new Date().toISOString().split("T")[0]
    }.csv`,
  );

  res.status(200).send(csv);
});

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientsSummary,
  exportPatientsSummary,
};
