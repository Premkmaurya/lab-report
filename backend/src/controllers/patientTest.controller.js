const PatientTest = require("../models/patientTest.model");

const getPatientTests = async (req, res) => {
  try {
    const patientTests = await PatientTest.find()
      .populate("patientId", "name age")
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
    const patientTest = await PatientTest.findById(req.params.id).populate(
      "patientId",
      "name age"
    );

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
    const { patientId, test, date } = req.body;

    if (!patientId || !test || test.length === 0) {
      return res.status(400).json({
        message: "Please provide patientId and at least one test",
      });
    }

    const patientTest = await PatientTest.create({
      patientId,
      test,
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
    const allowedFields = ["test", "date"];
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
      }
    ).populate("patientId", "name age");

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

module.exports = {
  getPatientTests,
  getPatientTestById,
  getTestsByPatientId,
  createPatientTest,
  updatePatientTest,
  deletePatientTest,
};
