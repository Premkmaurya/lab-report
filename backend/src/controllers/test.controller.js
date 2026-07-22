const Test = require("../models/test.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { invalidateCacheKey } = require("../services/cache.service");

const validateSubTests = (subTests) => {
  if (subTests && Array.isArray(subTests)) {
    for (const st of subTests) {
      if (st.isListParameter) {
        if (!st.allowedValues || !Array.isArray(st.allowedValues)) {
          throw new BadRequestError(`List parameter "${st.name || 'Unnamed'}" must have allowed values`);
        }
        const validValues = st.allowedValues
          .map(v => typeof v === 'string' ? v.trim() : '')
          .filter(v => v !== '');
        
        const uniqueValues = [...new Set(validValues)];
        
        if (uniqueValues.length < 2) {
          throw new BadRequestError(`List parameter "${st.name || 'Unnamed'}" must have at least two unique non-empty allowed values`);
        }
        st.allowedValues = uniqueValues;
      } else {
        st.allowedValues = [];
      }
    }
  }
};

const getTests = asyncHandler(async (req, res) => {
  const filter = { isGlobal: false, ...(req.tenantFilter || {}) };
  const tests = await Test.find(filter)
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
  const query = { _id: req.params.id, isGlobal: false, ...req.tenantFilter };
  const test = await Test.findOne(query)
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
  const { name, departmentId, price, subTests, laboratoryId } = req.body;

  if (!name || price === undefined || !departmentId) {
    throw new BadRequestError("Please provide name, departmentId, and price");
  }

  validateSubTests(subTests);

  const targetLabId = req.user.role === 'system_admin' && laboratoryId ? laboratoryId : req.user.laboratoryId;

  if (!targetLabId) {
    throw new BadRequestError("Laboratory ID is required for laboratory test creation");
  }

  let test = await Test.create({
    name,
    departmentId,
    price,
    subTests,
    isGlobal: false,
    createdBySystem: false,
    sourceTestId: null,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    laboratoryId: targetLabId,
  });

  test = await Test.findById(test._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  await invalidateCacheKey("tests:all");
  await invalidateCacheKey("tests:global:all");

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

  if (updates.subTests) {
    validateSubTests(updates.subTests);
  }

  updates.updatedBy = req.user._id;

  const query = { _id: req.params.id, isGlobal: false, ...req.tenantFilter };
  const test = await Test.findOneAndUpdate(query, updates, {
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
  const query = { _id: req.params.id, isGlobal: false, ...req.tenantFilter };
  const test = await Test.findOne(query);

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

// ==========================================
// GLOBAL TEST LIBRARY CONTROLLERS
// ==========================================

const getGlobalTests = asyncHandler(async (req, res) => {
  const { search, departmentId } = req.query;
  const filter = { isGlobal: true };

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { "subTests.name": searchRegex },
    ];
  }

  const globalTests = await Test.find(filter)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .sort({ name: 1 });

  const targetLabId = req.user.role === 'system_admin' 
    ? (req.query.laboratoryId || req.headers['x-laboratory-id'] || null)
    : req.user.laboratoryId;

  // Get list of tests already imported by this laboratory
  let importedSourceIdsMap = {};
  if (targetLabId) {
    const localImported = await Test.find({
      laboratoryId: targetLabId,
      sourceTestId: { $ne: null },
      isGlobal: false,
    }).select('sourceTestId _id');

    for (const item of localImported) {
      if (item.sourceTestId) {
        importedSourceIdsMap[item.sourceTestId.toString()] = item._id;
      }
    }
  }

  // Count how many labs imported each global test
  const globalTestIds = globalTests.map(gt => gt._id);
  const importCounts = await Test.aggregate([
    { $match: { sourceTestId: { $in: globalTestIds }, isGlobal: false, deleted: { $ne: true } } },
    { $group: { _id: "$sourceTestId", count: { $sum: 1 } } }
  ]);

  const importCountsMap = {};
  for (const ic of importCounts) {
    importCountsMap[ic._id.toString()] = ic.count;
  }

  const result = globalTests.map(gt => {
    const gtObj = gt.toObject();
    const gtIdStr = gt._id.toString();
    return {
      ...gtObj,
      isImported: Boolean(importedSourceIdsMap[gtIdStr]),
      importedLocalTestId: importedSourceIdsMap[gtIdStr] || null,
      importedCount: importCountsMap[gtIdStr] || 0,
    };
  });

  res.status(200).json({
    success: true,
    globalTests: result,
  });
});

const getGlobalTestById = asyncHandler(async (req, res) => {
  const test = await Test.findOne({ _id: req.params.id, isGlobal: true })
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  if (!test) {
    throw new NotFoundError("Global test template not found");
  }

  res.status(200).json({
    success: true,
    test,
  });
});

const createGlobalTest = asyncHandler(async (req, res) => {
  const { name, departmentId, price, subTests } = req.body;

  if (!name || price === undefined || !departmentId) {
    throw new BadRequestError("Please provide name, departmentId, and price");
  }

  validateSubTests(subTests);

  let test = await Test.create({
    name,
    departmentId,
    price,
    subTests,
    isGlobal: true,
    createdBySystem: true,
    sourceTestId: null,
    laboratoryId: null,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  test = await Test.findById(test._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  await invalidateCacheKey("tests:global:all");

  res.status(201).json({
    success: true,
    test,
  });
});

const updateGlobalTest = asyncHandler(async (req, res) => {
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

  if (updates.subTests) {
    validateSubTests(updates.subTests);
  }

  updates.updatedBy = req.user._id;

  const test = await Test.findOneAndUpdate(
    { _id: req.params.id, isGlobal: true },
    updates,
    { new: true, returnDocument: "after", runValidators: true }
  )
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  if (!test) {
    throw new NotFoundError("Global test template not found");
  }

  await invalidateCacheKey("tests:global:all");

  res.status(200).json({
    success: true,
    test,
  });
});

const deleteGlobalTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({ _id: req.params.id, isGlobal: true });

  if (!test) {
    throw new NotFoundError("Global test template not found");
  }

  await test.delete();

  await invalidateCacheKey("tests:global:all");

  res.status(200).json({
    success: true,
    message: "Global test template deleted successfully",
  });
});

const importGlobalTest = asyncHandler(async (req, res) => {
  const globalTest = await Test.findOne({ _id: req.params.id, isGlobal: true }).populate('departmentId');

  if (!globalTest) {
    throw new NotFoundError("Global test template not found");
  }

  const targetLabId = req.user.role === 'system_admin'
    ? (req.body.laboratoryId || req.query.laboratoryId || req.headers['x-laboratory-id'])
    : req.user.laboratoryId;

  if (!targetLabId) {
    throw new BadRequestError("Target laboratory ID is required for test import");
  }

  // Perform complete deep-clone of sub-tests
  const clonedSubTests = globalTest.subTests.map((st) => {
    const stObj = typeof st.toObject === 'function' ? st.toObject() : { ...st };
    delete stObj._id;
    return stObj;
  });

  const importedLocalTest = await Test.create({
    name: globalTest.name,
    departmentId: globalTest.departmentId?._id || globalTest.departmentId,
    price: globalTest.price,
    subTests: clonedSubTests,
    isGlobal: false,
    createdBySystem: false,
    sourceTestId: globalTest._id,
    laboratoryId: targetLabId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populatedTest = await Test.findById(importedLocalTest._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  await invalidateCacheKey("tests:all");
  await invalidateCacheKey("tests:global:all");

  res.status(201).json({
    success: true,
    test: populatedTest,
    message: "Global test imported successfully as an independent laboratory test",
  });
});

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getGlobalTests,
  getGlobalTestById,
  createGlobalTest,
  updateGlobalTest,
  deleteGlobalTest,
  importGlobalTest,
};
