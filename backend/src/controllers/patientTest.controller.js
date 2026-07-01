const PatientTest = require("../models/patientTest.model");
const Test = require("../models/test.model");

const getReportAndTestTemplate = async (req, res) => {
  try {
    const { id, testId } = req.params;

    const patientTest = await PatientTest.findById(id)
      .populate("patientId", "name age")
      .populate("createdBy", "username email");

    if (!patientTest) {
      return res.status(404).json({ message: "Patient test not found" });
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
      return res.status(404).json({ message: "Test template not found" });
    }

    res.status(200).json({
      success: true,
      patientTest,
      testTemplate,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch report and test template",
    });
  }
};

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

const getPatientTests = async (req, res) => {
  try {
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
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patientTests,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch patient tests",
    });
  }
};

const getPatientTestById = async (req, res) => {
  try {
    const patientTest = await PatientTest.findById(req.params.id)
      .populate("patientId", "name age")
      .populate("createdBy", "username email");

    if (!patientTest) {
      return res.status(404).json({
        message: "Patient test not found",
      });
    }

    res.status(200).json({
      success: true,
      patientTest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch patient test",
    });
  }
};

const getTestsByPatientId = async (req, res) => {
  try {
    const patientTests = await PatientTest.find({
      patientId: req.params.patientId,
    })
      .populate("patientId", "name age")
      .populate("tests.testId", "name departmentId")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patientTests,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch patient tests",
    });
  }
};

const createPatientTest = async (req, res) => {
  try {
    const { patientId, tests } = req.body;

    if (!patientId || !tests || tests.length === 0) {
      return res.status(400).json({
        message: "Please provide patientId and at least one test",
      });
    }

    const patientTest = await PatientTest.create({
      patientId,
      tests,
      createdBy: req.user._id,
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      patientTest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create patient test",
    });
  }
};

const updatePatientTest = async (req, res) => {
  try {
    const allowedFields = ["tests", "date"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one valid field to update",
      });
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
      .populate("createdBy", "username email");

    if (!patientTest) {
      return res.status(404).json({
        message: "Patient test not found",
      });
    }

    res.status(200).json({
      success: true,
      patientTest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update patient test",
    });
  }
};

const deletePatientTest = async (req, res) => {
  try {
    const patientTest = await PatientTest.findByIdAndDelete(req.params.id);

    if (!patientTest) {
      return res.status(404).json({
        message: "Patient test not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient test deleted successfully",
      patientTest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete patient test",
    });
  }
};

const addTestToReport = async (req, res) => {
  try {
    const { testId, testName } = req.body;

    const patientTest = await PatientTest.findById(req.params.id);
    if (!patientTest) {
      return res.status(404).json({ message: "Patient test not found" });
    }

    // Duplicate Check
    const exists = patientTest.tests.some(
      (t) => t.testId.toString() === testId,
    );
    if (exists) {
      return res.status(400).json({ message: "Test already exists in report" });
    }

    patientTest.tests.push({ testId, testName, result: [] });
    await patientTest.save();

    const updatedTest = await PatientTest.findById(req.params.id)
      .populate("patientId", "name age")
      .populate("createdBy", "username email");

    res.status(200).json({
      success: true,
      message: "Test added successfully",
      patientTest: updatedTest,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to add test to report",
    });
  }
};

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
