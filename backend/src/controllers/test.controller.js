const Test = require("../models/test.model");

const getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tests,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch tests",
    });
  }
};

const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      test,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch test",
    });
  }
};

const createTest = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        message: "Please provide name and price",
      });
    }

    const test = await Test.create({
      name,
      price,
    });

    res.status(201).json({
      success: true,
      test,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create test",
    });
  }
};

const updateTest = async (req, res) => {
  try {
    const allowedFields = ["name", "price"];
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

    const test = await Test.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      test,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update test",
    });
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
      test,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete test",
    });
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
};
