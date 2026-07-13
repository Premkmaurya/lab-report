const PrintTemplate = require("../models/printTemplate.model");
const { invalidateCacheKey } = require("../services/cache.service");

exports.getTemplate = async (req, res, next) => {
  try {
    // Use atomic upsert to avoid race-condition duplicate-key errors.
    // setOnInsert only writes defaults when no document exists yet,
    // so existing user settings are never overwritten.
    const template = await PrintTemplate.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, runValidators: false }
    );

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    // If a duplicate-key error still slips through (e.g. concurrent cold-start)
    // fall back to a plain findOne so the request still succeeds.
    if (error.code === 11000) {
      try {
        const template = await PrintTemplate.findOne({ userId: req.user._id });
        return res.status(200).json({ success: true, data: template });
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { page, typography, elements, signatures } = req.body;
    
    const template = await PrintTemplate.findOneAndUpdate(
      { userId: req.user._id },
      { page, typography, elements, signatures, userId: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    
    await invalidateCacheKey(`settings:print-template:${req.user._id}`);
    
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.resetTemplate = async (req, res, next) => {
  try {
    // Delete the current template for this user
    await PrintTemplate.findOneAndDelete({ userId: req.user._id });
    
    // Recreate the default one for this user
    const template = await PrintTemplate.create({ userId: req.user._id });
    
    await invalidateCacheKey(`settings:print-template:${req.user._id}`);
    
    res.status(200).json({ success: true, data: template, message: "Template reset to defaults" });
  } catch (error) {
    next(error);
  }
};
