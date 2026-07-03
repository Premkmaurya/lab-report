const Doctor = require("../models/doctor.model");
const { uploadFile } = require("../services/storage.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");

const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find();
  res.status(200).json({
    success: true,
    doctors,
  });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  res.status(200).json({
    success: true,
    doctor,
  });
});

const createDoctor = asyncHandler(async (req, res) => {
  const { name, qualification } = req.body;
  let signature = req.file;

  if (signature) {
    const signature_buffer = signature.buffer.toString("base64");
    const uploadedFile = await uploadFile(signature_buffer, name);
    signature = uploadedFile.url;
  }

  if (!name || !qualification || !signature) {
    throw new BadRequestError("Please provide name, qualification and signature file or signature");
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
});

const updateDoctor = asyncHandler(async (req, res) => {
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
    throw new BadRequestError("Please provide at least one valid field to update");
  }

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  res.status(200).json({
    success: true,
    doctor,
  });
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  await doctor.delete();

  res.status(200).json({
    success: true,
    message: "Doctor deleted successfully",
  });
});

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
