const Department = require("../models/department.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCacheKey, invalidateCachePattern } = require("../services/cache.service");

const DEFAULT_DEPARTMENTS = [
  "Hematology",
  "Biochemistry",
  "Microbiology",
  "Pathology",
  "Clinical Pathology",
  "Serology",
  "Radiology",
  "General",
];

const getDepartments = asyncHandler(async (req, res) => {
  let targetLabId = null;

  if (req.user.role === 'system_admin') {
    targetLabId = req.query.laboratoryId || req.headers['x-laboratory-id'] || null;
  } else {
    targetLabId = req.user.laboratoryId || null;
  }

  let filter = { isActive: true };
  if (targetLabId) {
    filter = {
      isActive: true,
      $or: [
        { laboratoryId: targetLabId },
        { laboratoryId: null },
        { laboratoryId: { $exists: false } }
      ]
    };
  }

  let departments = await Department.find(filter).sort({ name: 1 });

  // Auto-seed default departments for laboratory if 0 departments exist
  if (departments.length === 0 && targetLabId) {
    try {
      const seedDocs = DEFAULT_DEPARTMENTS.map((name) => ({
        name,
        laboratoryId: targetLabId,
        isActive: true,
      }));
      await Department.insertMany(seedDocs, { ordered: false });
      departments = await Department.find(filter).sort({ name: 1 });
    } catch (seedErr) {
      departments = await Department.find(filter).sort({ name: 1 });
    }
  }

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

  await invalidateCachePattern("*departments*");

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

  await invalidateCachePattern("*departments*");

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

  await invalidateCachePattern("*departments*");

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
