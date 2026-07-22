const PrintTemplate = require("../models/printTemplate.model");
const Laboratory = require("../models/laboratory.model");
const { invalidateCacheKey } = require("../services/cache.service");

// Helper to determine target lab ID based on user role
const resolveLabId = (req) => {
  if (req.user.role === 'system_admin') {
    const labId = req.query.laboratoryId || req.body?.laboratoryId || req.headers['x-laboratory-id'] || req.laboratoryId;
    if (labId) return labId;
  }
  return req.user.laboratoryId;
};

exports.getTemplate = async (req, res, next) => {
  try {
    let labId = resolveLabId(req);

    if (!labId && req.user.role === 'system_admin') {
      const defaultLab = await Laboratory.findOne({ status: { $ne: 'inactive' } });
      if (defaultLab) {
        labId = defaultLab._id;
      }
    }

    if (!labId) {
      let template = new PrintTemplate({ userId: req.user._id });
      return res.status(200).json({ success: true, data: template });
    }

    let template = await PrintTemplate.findOne({ laboratoryId: labId });

    if (!template) {
      try {
        template = await PrintTemplate.create({ laboratoryId: labId, userId: req.user._id });
        await invalidateCacheKey(`settings:print-template:${labId}`);
      } catch (createErr) {
        if (createErr.code === 11000) {
          template = await PrintTemplate.findOne({ laboratoryId: labId });
        } else {
          throw createErr;
        }
      }
    }

    if (!template) {
      template = new PrintTemplate({ laboratoryId: labId, userId: req.user._id });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { page, typography, elements, signatures } = req.body;
    let labId = resolveLabId(req);

    if (!labId) {
      return res.status(400).json({ success: false, message: 'Laboratory ID required' });
    }
    
    const template = await PrintTemplate.findOneAndUpdate(
      { laboratoryId: labId },
      { page, typography, elements, signatures, laboratoryId: labId, userId: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    
    await invalidateCacheKey(`settings:print-template:${labId}`);
    
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.resetTemplate = async (req, res, next) => {
  try {
    let labId = resolveLabId(req);

    if (!labId) {
      return res.status(400).json({ success: false, message: 'Laboratory ID required' });
    }

    await PrintTemplate.findOneAndDelete({ laboratoryId: labId });
    const template = await PrintTemplate.create({ laboratoryId: labId, userId: req.user._id });
    
    await invalidateCacheKey(`settings:print-template:${labId}`);
    
    res.status(200).json({ success: true, data: template, message: "Template reset to defaults" });
  } catch (error) {
    next(error);
  }
};
