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
        (t) => t.testId.toString() === testId
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

const getPatientTests = async (req, res) => {
  try {
    const patientTests = await PatientTest.find()
      .populate("patientId", "name age")
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
    const { patientId, tests, date } = req.body;

    if (!patientId || !tests || tests.length === 0) {
      return res.status(400).json({
        message: "Please provide patientId and at least one test",
      });
    }

    const patientTest = await PatientTest.create({
      patientId,
      tests,
      createdBy: req.user._id,
      date: date || new Date(),
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
