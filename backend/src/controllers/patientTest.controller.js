const PatientTest = require("../models/patientTest.model");
const Test = require("../models/test.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");

const computeTotalPrice = (report) => {
  let total = 0;
  if (report.tests && Array.isArray(report.tests)) {
    report.tests.forEach((t) => {
      if (t.testId && Array.isArray(t.testId.subTests)) {
        t.testId.subTests.forEach((st) => {
          total += st.price || 0;
        });
      }
    });
  }
  return total;
};

const getReportAndTestTemplate = asyncHandler(async (req, res) => {
  const { id, testId } = req.params;

  const patientTest = await PatientTest.findById(id)
    .populate("patientId", "name age")
    .populate("createdBy", "username email");

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  let testTemplate = await Test.findById(testId);
  if (!testTemplate) {
    // Fallback: If the test was deleted and recreated, the ID may be stale.
    // Lookup the template by the testName stored in the patient's report.
    const reportTest = patientTest.tests.find(
      (t) => t.testId.toString() === testId,
    );
    if (reportTest && reportTest.testName) {
      testTemplate = await Test.findOne({ name: reportTest.testName });
    }
  }

  if (!testTemplate) {
    throw new NotFoundError("Test template not found");
  }

  res.status(200).json({
    success: true,
    patientTest,
    testTemplate,
  });
});

const getRange = (
  period,
  timezoneOffsetMinutes = 0,
  customStart = null,
  customEnd = null,
) => {
  const tzOffset = parseInt(timezoneOffsetMinutes, 10) || 0;

  const now = new Date();
  const clientLocalTime = new Date(now.getTime() - tzOffset * 60 * 1000);

  let start = new Date(clientLocalTime);
  let end = new Date(clientLocalTime);
  end.setUTCHours(23, 59, 59, 999);

  if (period === "today") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "yesterday") {
    start.setUTCDate(start.getUTCDate() - 1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() - 1);
    end.setUTCHours(23, 59, 59, 999);
  } else if (period === "week") {
    const day = start.getUTCDay();
    const diff = start.getUTCDate() - day; // get Sunday
    start.setUTCDate(diff);
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "custom" && customStart && customEnd) {
    // Treat custom start/end as local dates parsed in UTC
    start = new Date(customStart);
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setUTCHours(23, 59, 59, 999);
  } else {
    // Default to today
    start.setUTCHours(0, 0, 0, 0);
  }

  // Convert back to UTC to query the database
  const utcStart = new Date(start.getTime() + tzOffset * 60 * 1000);
  const utcEnd = new Date(end.getTime() + tzOffset * 60 * 1000);

  return { start: utcStart, end: utcEnd };
};

const getPatientTests = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, timezoneOffset } = req.query;
  let query = {};

  // Only apply date filtering if explicitly requested or if it's the default workflow
  if (date) {
    const { start, end } = getRange(date, timezoneOffset, startDate, endDate);
    query.createdAt = { $gte: start, $lte: end };
  }
  const patientTests = await PatientTest.find(query)
    .populate("patientId", "name age gender referredDoctor")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    })
    .sort({ createdAt: -1 })
    .lean();

  const formattedPatientTests = patientTests.map(report => ({
    ...report,
    totalPrice: computeTotalPrice(report),
  }));

  res.status(200).json({
    success: true,
    patientTests: formattedPatientTests,
  });
});

const getPatientTestById = asyncHandler(async (req, res) => {
  const patientTest = await PatientTest.findById(req.params.id)
    .populate("patientId", "name age")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    });

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  const reportObj = patientTest.toObject();
  reportObj.totalPrice = computeTotalPrice(reportObj);

  res.status(200).json({
    success: true,
    patientTest: reportObj,
  });
});

const getTestsByPatientId = asyncHandler(async (req, res) => {
  const patientTests = await PatientTest.find({
    patientId: req.params.patientId,
  })
    .populate("patientId", "name age")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    })
    .sort({ createdAt: -1 })
    .lean();

  const formattedPatientTests = patientTests.map(report => ({
    ...report,
    totalPrice: computeTotalPrice(report),
  }));

  res.status(200).json({
    success: true,
    patientTests: formattedPatientTests,
  });
});

const createPatientTest = asyncHandler(async (req, res) => {
  const { patientId, tests } = req.body;

  if (!patientId || !tests || tests.length === 0) {
    throw new BadRequestError("Please provide patientId and at least one test");
  }

  const patientTest = await PatientTest.create({
    patientId,
    tests,
    createdBy: req.user._id,
    date: new Date(),
  });

  const populatedPatientTest = await PatientTest.findById(patientTest._id)
    .populate("patientId", "name age")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    });

  const reportObj = populatedPatientTest.toObject();
  reportObj.totalPrice = computeTotalPrice(reportObj);

  res.status(201).json({
    success: true,
    patientTest: reportObj,
  });
});

const updatePatientTest = asyncHandler(async (req, res) => {
  const allowedFields = ["tests", "date"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Please provide at least one valid field to update");
  }

  const patientTest = await PatientTest.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      returnDocument: "after",
      runValidators: true,
    },
  )
    .populate("patientId", "name age")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    });

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  const reportObj = patientTest.toObject();
  reportObj.totalPrice = computeTotalPrice(reportObj);

  res.status(200).json({
    success: true,
    patientTest: reportObj,
  });
});

const deletePatientTest = asyncHandler(async (req, res) => {
  const patientTest = await PatientTest.findById(req.params.id);

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  await patientTest.delete();

  res.status(200).json({
    success: true,
    message: "Patient test deleted successfully",
    patientTest,
  });
});

const addTestToReport = asyncHandler(async (req, res) => {
  const { testId, testName } = req.body;

  const patientTest = await PatientTest.findById(req.params.id);
  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  // Duplicate Check
  const exists = patientTest.tests.some(
    (t) => t.testId.toString() === testId,
  );
  if (exists) {
    throw new BadRequestError("Test already exists in report");
  }

  patientTest.tests.push({ testId, testName, result: [] });
  await patientTest.save();

  const updatedTest = await PatientTest.findById(req.params.id)
    .populate("patientId", "name age")
    .populate("createdBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name"
      }
    });

  const reportObj = updatedTest.toObject();
  reportObj.totalPrice = computeTotalPrice(reportObj);

  res.status(200).json({
    success: true,
    message: "Test added successfully",
    patientTest: reportObj,
  });
});

module.exports = {
  getPatientTests,
  getPatientTestById,
  getTestsByPatientId,
  createPatientTest,
  updatePatientTest,
  deletePatientTest,
  addTestToReport,
  getReportAndTestTemplate,
};
