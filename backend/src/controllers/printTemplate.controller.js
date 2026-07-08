const PrintTemplate = require("../models/printTemplate.model");

exports.getTemplate = async (req, res, next) => {
  try {
    let template = await PrintTemplate.findOne({ singletonIdentifier: "DEFAULT" });
    
    // If no template exists yet, create the default one
    if (!template) {
      template = await PrintTemplate.create({ singletonIdentifier: "DEFAULT" });
    }
    
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { page, typography, elements } = req.body;
    
    const template = await PrintTemplate.findOneAndUpdate(
      { singletonIdentifier: "DEFAULT" },
      { page, typography, elements },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.resetTemplate = async (req, res, next) => {
  try {
    // Delete the current template
    await PrintTemplate.findOneAndDelete({ singletonIdentifier: "DEFAULT" });
    
    // Recreate the default one
    const template = await PrintTemplate.create({ singletonIdentifier: "DEFAULT" });
    
    res.status(200).json({ success: true, data: template, message: "Template reset to defaults" });
  } catch (error) {
    next(error);
  }
};
