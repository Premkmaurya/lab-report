const Department = require("../models/department.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({
    success: true,
    departments,
  });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new BadRequestError("Department name is required");
  }

  const existing = await Department.findOne({ name });
  if (existing) {
    throw new BadRequestError("Department with this name already exists");
  }

  const department = await Department.create({
    name,
    description,
  });

  res.status(201).json({
    success: true,
    department,
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
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
    throw new NotFoundError("Department not found");
  }

  res.status(200).json({
    success: true,
    department,
  });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new NotFoundError("Department not found");
  }

  // Check if department is being used by any tests before soft deleting
  const Test = require("../models/test.model");
  const testsUsingDepartment = await Test.countDocuments({ departmentId: req.params.id });

  if (testsUsingDepartment > 0) {
    throw new BadRequestError(`Cannot delete department. It is currently assigned to ${testsUsingDepartment} tests.`);
  }

  await department.delete();

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
    department,
  });
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
