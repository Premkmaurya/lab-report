const Patient = require("../models/patient.model");

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patients,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch patients",
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "username email"
    );

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch patient",
    });
  }
};

const createPatient = async (req, res) => {
  try {
    const { name, age, gender, date, referredDoctor } = req.body;

    if (!name || !age || !gender || !referredDoctor) {
      return res.status(400).json({
        message:
          "Please provide name, age, gender, and referred doctor",
      });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      date: date || new Date(),
      referredDoctor,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create patient",
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const allowedFields = ["name", "age", "gender", "date", "referredDoctor"];
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

    const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).populate("createdBy", "name email");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update patient",
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
};
