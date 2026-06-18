const Doctor = require("../models/doctor.model");
const { uploadFile } = require("../services/storage.service");

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch doctors",
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch doctor",
    });
  }
};

const createDoctor = async (req, res) => {
  try {
    const { name, qualification } = req.body;
    let signature = req.file;

    if (signature) {
      const signature_buffer = signature.buffer.toString("base64");
      const uploadedFile = await uploadFile(signature_buffer, name);
      signature = uploadedFile.url;
    }

    if (!name || !qualification || !signature) {
      return res.status(400).json({
        message:
          "Please provide name, qualification and signature file or signature",
      });
    }

    const doctor = await Doctor.create({
      name,
      qualification,
      signUrl: signature,
    });

    res.status(201).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create doctor",
    });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const allowedFields = ["name", "qualification", "signUrl", "isActive"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const signature = req.file;

    if (signature) {
      const signature_buffer = signature.buffer.toString("base64");
      const uploadedFile = await uploadFile(signature_buffer, req.body.name);
      updates.signUrl = uploadedFile.url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one valid field to update",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update doctor",
    });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete doctor",
    });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
