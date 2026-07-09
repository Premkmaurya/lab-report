const Test = require("../models/test.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCacheKey } = require("../services/cache.service");

const getTests = asyncHandler(async (req, res) => {
  const tests = await Test.find()
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tests,
  });
});

const getTestById = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  res.status(200).json({
    success: true,
    test,
  });
});

const createTest = asyncHandler(async (req, res) => {
  const { name, departmentId, price, subTests } = req.body;

  if (!name || price === undefined || !departmentId) {
    throw new BadRequestError("Please provide name, departmentId, and price");
  }

  let test = await Test.create({
    name,
    departmentId,
    price,
    subTests,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  test = await Test.findById(test._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  await invalidateCacheKey("tests:all");

  res.status(201).json({
    success: true,
    test,
  });
});

const updateTest = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "price", "subTests", "departmentId"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Please provide at least one valid field to update");
  }

  updates.updatedBy = req.user._id;

  const test = await Test.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    returnDocument: "after",
    runValidators: true,
  })
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  await invalidateCacheKey("tests:all");
  await invalidateCacheKey(`test:${req.params.id}`);

  res.status(200).json({
    success: true,
    test,
  });
});

const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  await test.delete();

  await invalidateCacheKey("tests:all");
  await invalidateCacheKey(`test:${req.params.id}`);

  res.status(200).json({
    success: true,
    message: "Test deleted successfully",
    test,
  });
});

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
};
