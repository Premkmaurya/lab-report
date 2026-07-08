const LabDetails = require("../models/labDetails.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");

const getLabDetails = asyncHandler(async (req, res) => {
  const lab = await LabDetails.findOne({ userId: req.user._id });
  res.status(200).json({ success: true, labDetails: lab });
});

// Upsert handler used by existing PUT route
const createOrUpdateLabDetails = asyncHandler(async (req, res) => {
  const { laboratoryDisplayName, letterheadAddressLine, contactPhone, contactEmail } = req.body;

  const updates = {};
  if (laboratoryDisplayName !== undefined) updates.laboratoryDisplayName = laboratoryDisplayName;
  if (letterheadAddressLine !== undefined) updates.letterheadAddressLine = letterheadAddressLine;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Please provide at least one field to create or update lab details");
  }

  const lab = await LabDetails.findOneAndUpdate(
    { userId: req.user._id },
    { $set: updates, $setOnInsert: { userId: req.user._id } },
    { new: true, upsert: true, runValidators: true },
  );

  res.status(200).json({ success: true, labDetails: lab });
});

const deleteLabDetails = asyncHandler(async (req, res) => {
  const lab = await LabDetails.findOne({ userId: req.user._id });
  if (!lab) {
    throw new NotFoundError("Lab details not found");
  }

  await LabDetails.deleteOne({ _id: lab._id });

  res.status(200).json({ success: true, message: "Lab details deleted" });
});

module.exports = {
  getLabDetails,
  createOrUpdateLabDetails,
  deleteLabDetails,
};
