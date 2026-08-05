const PatientTest = require("../models/patientTest.model");
const Test = require("../models/test.model");
const Patient = require("../models/patient.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { autoImportGlobalTestIfNeeded } = require("./test.controller");

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

  const query = { _id: id, ...req.tenantFilter };
  const patientTest = await PatientTest.findOne(query)
    .populate("patientId", "name age visitId visitNumber gender date registeredAt referredDoctor")
    .populate("createdBy", "username email");

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  let testTemplate = await Test.findOne({ _id: testId, ...req.tenantFilter });
  if (!testTemplate) {
    const reportTest = patientTest.tests.find(
      (t) => t.testId.toString() === testId,
    );
    if (reportTest && reportTest.testName) {
      testTemplate = await Test.findOne({ name: reportTest.testName, ...req.tenantFilter });
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
    const diff = start.getUTCDate() - day;
    start.setUTCDate(diff);
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setUTCHours(23, 59, 59, 999);
  } else {
    start.setUTCHours(0, 0, 0, 0);
  }

  const utcStart = new Date(start.getTime() + tzOffset * 60 * 1000);
  const utcEnd = new Date(end.getTime() + tzOffset * 60 * 1000);

  return { start: utcStart, end: utcEnd };
};

const getPatientTests = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, timezoneOffset } = req.query;
  let query = { ...req.tenantFilter };

  if (date) {
    const { start, end } = getRange(date, timezoneOffset, startDate, endDate);
    query.createdAt = { $gte: start, $lte: end };
  }
  const patientTests = await PatientTest.find(query)
    .populate("patientId")
    .populate("createdBy", "username email")
    .populate("firstPrintedBy", "username email")
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
  const query = { _id: req.params.id, ...req.tenantFilter };
  const patientTest = await PatientTest.findOne(query)
    .populate("patientId")
    .populate("createdBy", "username email")
    .populate("firstPrintedBy", "username email")
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
  const query = {
    patientId: req.params.patientId,
    ...req.tenantFilter,
  };
  const patientTests = await PatientTest.find(query)
    .populate("patientId")
    .populate("createdBy", "username email")
    .populate("firstPrintedBy", "username email")
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
  const { patientId, tests, laboratoryId } = req.body;

  if (!patientId || !tests || tests.length === 0) {
    throw new BadRequestError("Please provide patientId and at least one test");
  }

  // 1. Fetch patient document to verify existence and laboratory scope
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  // Target laboratory is the patient's laboratory (or explicitly provided laboratoryId)
  const targetLabId = (laboratoryId || patient.laboratoryId || req.user.laboratoryId)?.toString();

  if (!targetLabId) {
    throw new BadRequestError("Laboratory ID is required");
  }

  // Verify patient's laboratory matches targetLabId
  if (patient.laboratoryId && patient.laboratoryId.toString() !== targetLabId) {
    throw new BadRequestError("Patient does not belong to the target laboratory");
  }

  const testsWithResults = await Promise.all(
    tests.map(async (t) => {
      const rawTest = await Test.findById(t.testId);
      let template = null;

      if (rawTest) {
        if (!rawTest.isGlobal) {
          template = await Test.findOne({ _id: rawTest._id, laboratoryId: targetLabId, isGlobal: false, deleted: { $ne: true } });
        } else {
          // Auto-import Global Test if not imported yet for targetLabId
          template = await autoImportGlobalTestIfNeeded(rawTest, targetLabId, req.user._id);
        }
      } else {
        template = await Test.findOne({ _id: t.testId, laboratoryId: targetLabId, isGlobal: false, deleted: { $ne: true } });
      }

      if (!template) {
        throw new BadRequestError(`Test '${t.testName || t.testId}' is not available in the patient's laboratory`);
      }

      let result = [];
      if (template && template.subTests) {
        result = template.subTests.map((st) => {
          const isTb = st.isTextBlock || st.type === "text_block";
          return {
            parameter: st.name,
            type: st.type === "text_block" ? "parameter" : (st.type || "parameter"),
            isListParameter: !!st.isListParameter,
            isTextBlock: isTb,
            allowedValues: st.allowedValues || [],
            unit: st.unit || "",
            normalRange: st.normalRange || "",
            referenceRanges: st.referenceRanges || [],
            value: "",
            textBlockValue: isTb ? (st.textBlockSettings?.defaultText || "") : "",
          };
        });
      }
      return {
        testId: template._id,
        testName: t.testName || template.name,
        result,
      };
    })
  );

  const patientTest = await PatientTest.create({
    patientId,
    tests: testsWithResults,
    createdBy: req.user._id,
    laboratoryId: targetLabId,
    date: new Date(),
  });

  const populatedPatientTest = await PatientTest.findById(patientTest._id)
    .populate("patientId", "name age visitId visitNumber gender date registeredAt referredDoctor")
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
  const query = { _id: req.params.id, ...req.tenantFilter };
  const existingReport = await PatientTest.findOne(query);

  if (!existingReport) {
    throw new NotFoundError("Patient test not found");
  }

  const { tests } = req.body;
  const updates = {};

  if (tests) updates.tests = tests;

  const updatedTest = await PatientTest.findOneAndUpdate(
    query,
    updates,
    { returnDocument: "after", runValidators: true }
  )
    .populate("patientId", "name age visitId visitNumber gender date registeredAt referredDoctor")
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
    patientTest: reportObj,
  });
});

const deletePatientTest = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, ...req.tenantFilter };
  const patientTest = await PatientTest.findOne(query);

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
  const reportId = req.params.id;

  const query = { _id: reportId, ...req.tenantFilter };
  const patientTest = await PatientTest.findOne(query);
  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  const targetLabId = (patientTest.laboratoryId?._id || patientTest.laboratoryId || req.laboratoryId || req.user?.laboratoryId)?.toString();

  const rawTest = await Test.findById(testId);

  let template = null;
  let findQuery = {};

  if (rawTest) {
    if (!rawTest.isGlobal) {
      // Test is a laboratory test
      findQuery = { _id: rawTest._id, laboratoryId: targetLabId, isGlobal: false, deleted: { $ne: true } };
      template = await Test.findOne(findQuery);

      if (!template && rawTest.laboratoryId?.toString() !== targetLabId) {
        throw new BadRequestError(`Test '${rawTest.name}' belongs to another laboratory and cannot be added to this report`);
      }
    } else {
      template = await autoImportGlobalTestIfNeeded(rawTest, targetLabId, req.user._id);
    }
  } else {
    // Fallback search by ID and targetLabId
    findQuery = { _id: testId, laboratoryId: targetLabId, isGlobal: false, deleted: { $ne: true } };
    template = await Test.findOne(findQuery);
  }

  if (!template) {
    throw new BadRequestError(`Test '${testName || rawTest?.name || testId}' is not available in the report's laboratory`);
  }

  const resolvedTestId = template._id.toString();

  const exists = patientTest.tests.some(
    (t) => t.testId?.toString() === resolvedTestId || (rawTest?.isGlobal && t.testId?.toString() === testId)
  );
  if (exists) {
    throw new BadRequestError("Test already exists in report");
  }

  let result = [];
  if (template && template.subTests) {
    result = template.subTests.map((st) => {
      const isTb = st.isTextBlock || st.type === "text_block";
      return {
        parameter: st.name,
        type: st.type === "text_block" ? "parameter" : (st.type || "parameter"),
        isListParameter: !!st.isListParameter,
        isTextBlock: isTb,
        allowedValues: st.allowedValues || [],
        unit: st.unit || "",
        normalRange: st.normalRange || "",
        referenceRanges: st.referenceRanges || [],
        value: "",
        textBlockValue: isTb ? (st.textBlockSettings?.defaultText || "") : "",
      };
    });
  }

  patientTest.tests.push({ 
    testId: template._id, 
    testName: testName || template.name, 
    result 
  });
  await patientTest.save();

  const updatedTest = await PatientTest.findById(req.params.id)
    .populate("patientId", "name age visitId visitNumber gender date registeredAt referredDoctor")
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

const recordPrint = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, ...req.tenantFilter };
  const patientTest = await PatientTest.findOne(query);

  if (!patientTest) {
    throw new NotFoundError("Patient test not found");
  }

  if (!patientTest.hasBeenPrinted) {
    patientTest.hasBeenPrinted = true;
    patientTest.firstPrintedAt = new Date();
    patientTest.firstPrintedBy = req.user._id;
    await patientTest.save();
  }

  const updatedTest = await PatientTest.findById(patientTest._id)
    .populate("patientId")
    .populate("createdBy", "username email")
    .populate("firstPrintedBy", "username email")
    .populate({
      path: "tests.testId",
      populate: {
        path: "departmentId",
        select: "name",
      },
    });

  const reportObj = updatedTest.toObject();
  reportObj.totalPrice = computeTotalPrice(reportObj);

  res.status(200).json({
    success: true,
    message: "Report print status recorded successfully",
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
  recordPrint,
};
