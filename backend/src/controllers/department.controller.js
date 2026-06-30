const Department = require("../models/department.model");

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      departments,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch departments",
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({
        message: "Department with this name already exists",
      });
    }

    const department = await Department.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create department",
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;

    const department = await Department.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update department",
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    // Soft delete or hard delete? Since tests reference it, let's just allow hard delete for now, or maybe set isActive=false. Let's do hard delete for simplicity unless it fails constraints.
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete department",
    });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
