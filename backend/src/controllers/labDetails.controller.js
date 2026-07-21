const Laboratory = require("../models/laboratory.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCacheKey } = require("../services/cache.service");

const getLabDetails = asyncHandler(async (req, res) => {
  const labId = req.laboratoryId || req.user.laboratoryId;
  if (!labId) {
    return res.status(200).json({ success: true, labDetails: null });
  }

  const lab = await Laboratory.findById(labId);
  if (!lab) {
    return res.status(200).json({ success: true, labDetails: null });
  }

  const mappedLabDetails = {
    _id: lab._id,
    laboratoryDisplayName: lab.name,
    letterheadAddressLine: lab.letterheadAddressLine || lab.address,
    contactPhone: lab.phone,
    contactEmail: lab.email,
    logo: lab.logo,
    code: lab.code,
    gstNumber: lab.gstNumber,
    licenseNumber: lab.licenseNumber,
  };

  res.status(200).json({ success: true, labDetails: mappedLabDetails });
});

// Upsert handler used by existing PUT route
const createOrUpdateLabDetails = asyncHandler(async (req, res) => {
  const { laboratoryDisplayName, letterheadAddressLine, contactPhone, contactEmail, logo } = req.body;
  const labId = req.laboratoryId || req.user.laboratoryId;

  if (!labId) {
    throw new BadRequestError("User is not associated with any laboratory");
  }

  const updates = {};
  if (laboratoryDisplayName !== undefined) updates.name = laboratoryDisplayName;
  if (letterheadAddressLine !== undefined) updates.letterheadAddressLine = letterheadAddressLine;
  if (contactPhone !== undefined) updates.phone = contactPhone;
  if (contactEmail !== undefined) updates.email = contactEmail;
  if (logo !== undefined) updates.logo = logo;

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Please provide at least one field to update lab details");
  }

  const lab = await Laboratory.findByIdAndUpdate(
    labId,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!lab) {
    throw new NotFoundError("Laboratory not found");
  }

  await invalidateCacheKey(`settings:lab-details:${req.user._id}`);

  const mappedLabDetails = {
    _id: lab._id,
    laboratoryDisplayName: lab.name,
    letterheadAddressLine: lab.letterheadAddressLine || lab.address,
    contactPhone: lab.phone,
    contactEmail: lab.email,
    logo: lab.logo,
    code: lab.code,
  };

  res.status(200).json({ success: true, labDetails: mappedLabDetails });
});

const deleteLabDetails = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Lab details cleared" });
});

module.exports = {
  getLabDetails,
  createOrUpdateLabDetails,
  deleteLabDetails,
};
