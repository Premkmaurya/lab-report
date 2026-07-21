const Laboratory = require('../models/laboratory.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');

/**
 * Get all laboratories (System Admin only)
 */
const getLaboratories = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [laboratories, total] = await Promise.all([
      Laboratory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'username email'),
      Laboratory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: laboratories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single laboratory by ID
 */
const getLaboratoryById = async (req, res, next) => {
  try {
    const laboratory = await Laboratory.findById(req.params.id).populate('createdBy', 'username email');
    if (!laboratory) {
      return res.status(404).json({ success: false, message: 'Laboratory not found' });
    }

    const [userCount, patientCount] = await Promise.all([
      User.countDocuments({ laboratoryId: laboratory._id }),
      Patient.countDocuments({ laboratoryId: laboratory._id }),
    ]);

    res.json({
      success: true,
      data: {
        ...laboratory.toObject(),
        stats: {
          users: userCount,
          patients: patientCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new laboratory (System Admin only)
 */
const createLaboratory = async (req, res, next) => {
  try {
    const { name, code, logo, address, letterheadAddressLine, phone, email, gstNumber, licenseNumber } = req.body;

    const existingCode = await Laboratory.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Laboratory code "${code}" already exists` });
    }

    const laboratory = await Laboratory.create({
      name,
      code: code.toUpperCase(),
      logo: logo || '',
      address: address || '',
      letterheadAddressLine: letterheadAddressLine || '',
      phone: phone || '',
      email: email || '',
      gstNumber: gstNumber || '',
      licenseNumber: licenseNumber || '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Laboratory created successfully',
      data: laboratory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update laboratory details
 */
const updateLaboratory = async (req, res, next) => {
  try {
    const { name, logo, address, letterheadAddressLine, phone, email, gstNumber, licenseNumber, settings } = req.body;

    const laboratory = await Laboratory.findById(req.params.id);
    if (!laboratory) {
      return res.status(404).json({ success: false, message: 'Laboratory not found' });
    }

    if (name) laboratory.name = name;
    if (logo !== undefined) laboratory.logo = logo;
    if (address !== undefined) laboratory.address = address;
    if (letterheadAddressLine !== undefined) laboratory.letterheadAddressLine = letterheadAddressLine;
    if (phone !== undefined) laboratory.phone = phone;
    if (email !== undefined) laboratory.email = email;
    if (gstNumber !== undefined) laboratory.gstNumber = gstNumber;
    if (licenseNumber !== undefined) laboratory.licenseNumber = licenseNumber;
    if (settings) laboratory.settings = { ...laboratory.settings, ...settings };

    await laboratory.save();

    res.json({
      success: true,
      message: 'Laboratory updated successfully',
      data: laboratory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update laboratory status (active / inactive / suspended)
 */
const updateLaboratoryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const laboratory = await Laboratory.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!laboratory) {
      return res.status(404).json({ success: false, message: 'Laboratory not found' });
    }

    res.json({
      success: true,
      message: `Laboratory status updated to ${status}`,
      data: laboratory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete / deactivate laboratory
 */
const deleteLaboratory = async (req, res, next) => {
  try {
    const laboratory = await Laboratory.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!laboratory) {
      return res.status(404).json({ success: false, message: 'Laboratory not found' });
    }

    res.json({
      success: true,
      message: 'Laboratory deactivated successfully',
      data: laboratory,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  updateLaboratoryStatus,
  deleteLaboratory,
};
