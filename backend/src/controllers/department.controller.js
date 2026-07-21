const Department = require("../models/department.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCacheKey } = require("../services/cache.service");

const getDepartments = asyncHandler(async (req, res) => {
  const query = { isActive: true, ...req.tenantFilter };
  const departments = await Department.find(query).sort({ name: 1 });
  res.status(200).json({
    success: true,
    departments,
  });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, laboratoryId } = req.body;

  if (!name) {
    throw new BadRequestError("Department name is required");
  }

  const existing = await Department.findOne({ name, ...req.tenantFilter });
  if (existing) {
    throw new BadRequestError("Department with this name already exists");
  }

  const department = await Department.create({
    name,
    description,
    laboratoryId: laboratoryId || req.user.laboratoryId,
  });

  await invalidateCacheKey("departments:all");

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

  const query = { _id: req.params.id, ...req.tenantFilter };
  const department = await Department.findOneAndUpdate(query, updates, {
    new: true,
    runValidators: true,
  });

  if (!department) {
    throw new NotFoundError("Department not found");
  }

  await invalidateCacheKey("departments:all");

  res.status(200).json({
    success: true,
    department,
  });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, ...req.tenantFilter };
  const department = await Department.findOne(query);

  if (!department) {
    throw new NotFoundError("Department not found");
  }

  // Check if department is being used by any tests before soft deleting
  const Test = require("../models/test.model");
  const testsUsingDepartment = await Test.countDocuments({ departmentId: req.params.id, ...req.tenantFilter });

  if (testsUsingDepartment > 0) {
    throw new BadRequestError(`Cannot delete department. It is currently assigned to ${testsUsingDepartment} tests.`);
  }

  await department.delete();

  await invalidateCacheKey("departments:all");

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
