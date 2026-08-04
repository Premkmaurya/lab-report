const mongoose = require("mongoose");
const Test = require("../models/test.model");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError } = require("../utils/errors");
const { invalidateCacheKey, invalidateCachePattern } = require("../services/cache.service");

const convertToDaysHelper = (age, unit = "Years") => {
  const numericAge = parseFloat(age);
  if (isNaN(numericAge) || numericAge < 0) return 0;
  const normalizedUnit = (unit || "Years").toLowerCase().trim();
  if (normalizedUnit.startsWith("day")) return numericAge;
  if (normalizedUnit.startsWith("month")) return numericAge * 30.4375;
  return numericAge * 365;
};

const validateReferenceRangesHelper = (rules, paramName = "Parameter") => {
  if (!Array.isArray(rules) || rules.length === 0) return;

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const fromNum = parseFloat(r.ageFrom);
    const toNum = parseFloat(r.ageTo);

    if (isNaN(fromNum) || fromNum < 0) {
      throw new BadRequestError(`"${paramName}" Rule #${i + 1}: Age From cannot be negative or invalid`);
    }
    if (isNaN(toNum) || toNum < 0) {
      throw new BadRequestError(`"${paramName}" Rule #${i + 1}: Age To cannot be negative or invalid`);
    }
    if (fromNum > toNum) {
      throw new BadRequestError(`"${paramName}" Rule #${i + 1}: Age From (${fromNum}) cannot be greater than Age To (${toNum})`);
    }
    if (!r.referenceRange || !r.referenceRange.trim()) {
      throw new BadRequestError(`"${paramName}" Rule #${i + 1}: Reference Range string cannot be empty`);
    }
  }

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const r1 = rules[i];
      const r2 = rules[j];

      const g1 = (r1.gender || "Any").toLowerCase();
      const g2 = (r2.gender || "Any").toLowerCase();

      const fromDays1 = convertToDaysHelper(r1.ageFrom, r1.ageUnit);
      const toDays1 = convertToDaysHelper(r1.ageTo, r1.ageUnit);
      const fromDays2 = convertToDaysHelper(r2.ageFrom, r2.ageUnit);
      const toDays2 = convertToDaysHelper(r2.ageTo, r2.ageUnit);

      if (g1 === g2 && fromDays1 === fromDays2 && toDays1 === toDays2) {
        throw new BadRequestError(`"${paramName}": Duplicate reference range rule detected for Rule #${i + 1} and Rule #${j + 1}`);
      }

      const genderOverlaps = g1 === g2;
      if (genderOverlaps) {
        const ageOverlaps = Math.max(fromDays1, fromDays2) <= Math.min(toDays1, toDays2);
        if (ageOverlaps) {
          throw new BadRequestError(
            `"${paramName}": Overlapping age range detected between Rule #${i + 1} (${r1.ageFrom}-${r1.ageTo} ${r1.ageUnit}, ${r1.gender}) and Rule #${j + 1} (${r2.ageFrom}-${r2.ageTo} ${r2.ageUnit}, ${r2.gender})`
          );
        }
      }
    }
  }
};

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

      if (st.referenceRanges && Array.isArray(st.referenceRanges)) {
        validateReferenceRangesHelper(st.referenceRanges, st.name || 'Parameter');
      }
    }
  }
};

const getTests = asyncHandler(async (req, res) => {
  const isSystemAdmin = req.user.role === 'system_admin';
  const targetLabId = req.query.laboratoryId || req.headers['x-laboratory-id'] || req.laboratoryId || req.tenantFilter?.laboratoryId;

  let filter;

  if (isSystemAdmin && !targetLabId) {
    // System admin with no specific laboratory context → show only global test library
    filter = { isGlobal: true, deleted: { $ne: true } };
  } else {
    // Lab users or system_admin scoped to a specific lab → show all lab tests for that laboratory (local + imported)
    const effectiveLabId = targetLabId || req.user?.laboratoryId;
    filter = { laboratoryId: effectiveLabId, isGlobal: false, deleted: { $ne: true } };
  }

  console.log("=== GET TESTS BACKEND DEBUG LOG ===");
  console.log("Current user role:", req.user?.role);
  console.log("Current user laboratoryId:", req.user?.laboratoryId?.toString() ?? null);
  console.log("Target laboratoryId:", targetLabId?.toString() ?? null);
  console.log("Mongo query filter:", JSON.stringify(filter));

  const tests = await Test.find(filter)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id')
    .sort({ createdAt: -1 });

  console.log("Number of tests returned from Mongo:", tests.length);

  res.status(200).json({
    success: true,
    tests,
  });
});

const getTestById = asyncHandler(async (req, res) => {
  const isSystemAdmin = req.user.role === 'system_admin';
  const hasLabContext = !!(req.laboratoryId || req.tenantFilter?.laboratoryId);

  let query;
  if (isSystemAdmin && !hasLabContext) {
    // System admin with no specific lab: can fetch any test by ID (global or local)
    query = { _id: req.params.id };
  } else {
    query = { _id: req.params.id, isGlobal: false, ...req.tenantFilter };
  }

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

  const isSystemAdmin = req.user.role === 'system_admin';

  if (isSystemAdmin) {
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
      .populate('createdBy', 'username _id')
      .populate('updatedBy', 'username _id');

    await invalidateCachePattern("*test*");

    return res.status(201).json({
      success: true,
      test,
    });
  }

  const targetLabId = req.user.role === 'system_admin' ? (laboratoryId || req.laboratoryId) : req.user.laboratoryId;

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

  await invalidateCachePattern("*test*");

  res.status(201).json({
    success: true,
    test,
  });
});

const updateTest = asyncHandler(async (req, res) => {
  const isSystemAdmin = req.user.role === 'system_admin';

  if (!isSystemAdmin) {
    if (req.body.name !== undefined || req.body.departmentId !== undefined) {
      throw new ForbiddenError("Only System Admin can edit test definitions and structure. Laboratory users can only update prices.");
    }
  }

  const existingTest = await Test.findOne({ _id: req.params.id, ...req.tenantFilter });
  if (!existingTest) {
    throw new NotFoundError("Test not found");
  }

  if (existingTest.isGlobal) {
    throw new ForbiddenError("Global Tests are read-only. Import this test into a laboratory to customize pricing or use the update workflow.");
  }

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

  if (!isSystemAdmin && updates.subTests) {
    const origSubTests = existingTest.subTests || [];
    const newSubTests = updates.subTests;

    if (!Array.isArray(newSubTests) || newSubTests.length !== origSubTests.length) {
      throw new ForbiddenError("Only System Admin can add or remove test parameters. Laboratory users can only update prices.");
    }

    for (let i = 0; i < origSubTests.length; i++) {
      const orig = origSubTests[i];
      const updated = newSubTests[i];
      if (
        (updated.name !== undefined && updated.name !== orig.name) ||
        (updated.type !== undefined && updated.type !== orig.type) ||
        (updated.unit !== undefined && updated.unit !== orig.unit) ||
        (updated.normalRange !== undefined && updated.normalRange !== orig.normalRange) ||
        (updated.isCalculated !== undefined && updated.isCalculated !== orig.isCalculated) ||
        (updated.isListParameter !== undefined && updated.isListParameter !== orig.isListParameter) ||
        (updated.isTextBlock !== undefined && updated.isTextBlock !== orig.isTextBlock)
      ) {
        throw new ForbiddenError("Only System Admin can modify parameter definitions or formulas. Laboratory users can only update prices.");
      }
    }
  }

  if (updates.subTests) {
    validateSubTests(updates.subTests);
  }

  updates.updatedBy = req.user._id;

  const test = await Test.findOneAndUpdate({ _id: req.params.id, isGlobal: false, ...req.tenantFilter }, updates, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  await invalidateCachePattern("*test*");

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

  await invalidateCachePattern("*test*");

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

  if (departmentId && departmentId !== 'undefined' && departmentId !== 'null' && departmentId !== 'ALL') {
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
    }).select('sourceTestId _id importedVersion');

    for (const item of localImported) {
      if (item.sourceTestId) {
        importedSourceIdsMap[item.sourceTestId.toString()] = {
          localTestId: item._id,
          importedVersion: item.importedVersion || 1,
        };
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
    const importedData = importedSourceIdsMap[gtIdStr];
    const globalVersion = gt.version || 1;
    const importedVersion = importedData ? (importedData.importedVersion || 1) : null;
    const isImported = Boolean(importedData);
    const hasUpdateAvailable = isImported && globalVersion > importedVersion;

    return {
      ...gtObj,
      version: globalVersion,
      isImported,
      importedLocalTestId: importedData ? importedData.localTestId : null,
      importedVersion,
      hasUpdateAvailable,
      importedCount: importCountsMap[gtIdStr] || 0,
    };
  });

  const updatesAvailableCount = result.filter(item => item.hasUpdateAvailable).length;

  res.status(200).json({
    success: true,
    globalTests: result,
    updatesAvailableCount,
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
    version: 1,
    sourceTestId: null,
    laboratoryId: null,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  test = await Test.findById(test._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  await invalidateCachePattern("*test*");

  res.status(201).json({
    success: true,
    test,
  });
});

const updateGlobalTest = asyncHandler(async (req, res) => {
  const existingTest = await Test.findOne({ _id: req.params.id, isGlobal: true });
  if (!existingTest) {
    throw new NotFoundError("Global test template not found");
  }

  if (existingTest.isGlobal) {
    throw new ForbiddenError("Global Tests are read-only. Import this test into a laboratory to customize pricing or use the update workflow.");
  }

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

  // Check for structural changes to increment version number
  const isStructuralChange =
    (updates.name !== undefined && updates.name !== existingTest.name) ||
    (updates.departmentId !== undefined && updates.departmentId.toString() !== existingTest.departmentId?.toString()) ||
    updates.subTests !== undefined;

  if (isStructuralChange) {
    updates.version = (existingTest.version || 1) + 1;
  }

  updates.updatedBy = req.user._id;

  const test = await Test.findOneAndUpdate(
    { _id: req.params.id, isGlobal: true },
    updates,
    { returnDocument: "after", runValidators: true }
  )
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  if (!test) {
    throw new NotFoundError("Global test template not found");
  }

  await invalidateCachePattern("*test*");

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

  await invalidateCachePattern("*test*");

  res.status(200).json({
    success: true,
    message: "Global test template deleted successfully",
  });
});

/**
 * Helper to remap all formula parameter ID references from global sub-test IDs
 * to the newly-assigned local sub-test IDs.
 *
 * Remaps ALL of:
 *   - formula.leftParameterId  (legacy two-operand format)
 *   - formula.rightParameterId (legacy two-operand format)
 *   - formula.tokens[].parameterId  (new unlimited token format)
 */
const remapSubTestFormulas = (globalSubTests, newSubTests) => {
  // ── Step 1: Build id / name → new id lookup maps ──────────────────────────
  const oldIdToNewIdMap = {};
  const nameToNewIdMap = {};
  const validNewIdsSet = new Set();

  newSubTests.forEach((newSt, idx) => {
    const newIdStr = newSt._id ? newSt._id.toString() : null;
    if (newIdStr) {
      validNewIdsSet.add(newIdStr);
    }

    const origSt = globalSubTests ? globalSubTests[idx] : null;
    if (origSt && origSt._id && newIdStr) {
      oldIdToNewIdMap[origSt._id.toString()] = newIdStr;
    }

    if (newSt.name && newIdStr) {
      nameToNewIdMap[newSt.name.trim().toLowerCase()] = newIdStr;
    }
    if (origSt && origSt.name && newIdStr) {
      nameToNewIdMap[origSt.name.trim().toLowerCase()] = newIdStr;
    }
  });

  // ── Step 2: Remap all formula parameter references ─────────────────────────
  newSubTests.forEach((st) => {
    if (!st.isCalculated || !st.formula) return;

    const formula = typeof st.formula.toObject === 'function' ? st.formula.toObject() : { ...st.formula };

    /**
     * Resolves a single parameterId to its new local ID.
     * Priority: already-valid new ID → old→new map → name map → null (warn).
     */
    const resolveAndValidateParamId = (paramId, label) => {
      if (!paramId) return paramId;
      const idStr = String(paramId).trim();

      // 1. Already a valid imported ID — no remapping needed
      if (validNewIdsSet.has(idStr)) return idStr;

      // 2. Direct old → new ID mapping (most common case)
      if (oldIdToNewIdMap[idStr]) return oldIdToNewIdMap[idStr];

      // 3. Fall back to parameter name match
      const lowerName = idStr.toLowerCase();
      if (nameToNewIdMap[lowerName]) return nameToNewIdMap[lowerName];

      // 4. Nothing matched — warn and clear
      console.warn(
        `[Formula Remap Warning] "${st.name}" formula references non-existent parameter ID "${paramId}" (${label}).`
      );
      return null;
    };

    // ── Remap legacy left operand ──────────────────────────────────────────
    if (formula.leftType !== 'constant' && formula.leftParameterId) {
      const remapped = resolveAndValidateParamId(formula.leftParameterId, 'leftParameterId');
      formula.leftParameterId = remapped || '';
      if (!remapped) {
        console.warn(`[Formula Remap Warning] Clearing invalid leftParameterId for "${st.name}".`);
      }
    }

    // ── Remap legacy right operand ─────────────────────────────────────────
    if (formula.rightType !== 'constant' && formula.rightParameterId) {
      const remapped = resolveAndValidateParamId(formula.rightParameterId, 'rightParameterId');
      formula.rightParameterId = remapped || '';
      if (!remapped) {
        console.warn(`[Formula Remap Warning] Clearing invalid rightParameterId for "${st.name}".`);
      }
    }

    // ── Remap token array (new unlimited formula format) ───────────────────
    if (Array.isArray(formula.tokens) && formula.tokens.length > 0) {
      formula.tokens = formula.tokens.map((token, tokenIdx) => {
        // Only parameter tokens carry a parameterId reference
        if (token.type !== 'parameter') return token;

        const remapped = resolveAndValidateParamId(
          token.parameterId,
          `tokens[${tokenIdx}].parameterId`
        );

        if (!remapped) {
          console.warn(
            `[Formula Remap Warning] Clearing invalid token parameterId at index ${tokenIdx} for "${st.name}".`
          );
        }

        return {
          ...token,
          parameterId: remapped || '',
          // Update the display name to match the newly-imported parameter
          parameterName: remapped
            ? (newSubTests.find(s => s._id && s._id.toString() === remapped)?.name || token.parameterName)
            : token.parameterName,
        };
      });
    }

    st.formula = formula;
  });

  return newSubTests;
};


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

  const existingImport = await Test.findOne({
    laboratoryId: targetLabId,
    sourceTestId: globalTest._id,
    isGlobal: false,
    deleted: { $ne: true },
  });

  if (existingImport) {
    throw new ConflictError("This global test has already been imported into your laboratory.");
  }

  // Step 1: Create all sub-tests with new explicit ObjectIds first
  const clonedSubTests = globalTest.subTests.map((st) => {
    const stObj = typeof st.toObject === 'function' ? st.toObject() : { ...st };
    stObj._id = new mongoose.Types.ObjectId();
    return stObj;
  });

  // Step 2, 3 & 4: Remap formula references using oldId -> newId mapping & validate
  remapSubTestFormulas(globalTest.subTests, clonedSubTests);

  const importedLocalTest = await Test.create({
    name: globalTest.name,
    departmentId: globalTest.departmentId?._id || globalTest.departmentId,
    price: globalTest.price,
    subTests: clonedSubTests,
    isGlobal: false,
    createdBySystem: false,
    sourceTestId: globalTest._id,
    importedVersion: globalTest.version || 1,
    importedAt: new Date(),
    lastUpdatedFromGlobalAt: new Date(),
    laboratoryId: targetLabId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populatedTest = await Test.findById(importedLocalTest._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id');

  await invalidateCachePattern("*test*");

  res.status(201).json({
    success: true,
    test: populatedTest,
    message: "Global test imported successfully as an independent laboratory test",
  });
});

const updateImportedGlobalTest = asyncHandler(async (req, res) => {
  const globalTest = await Test.findOne({ _id: req.params.id, isGlobal: true }).populate('departmentId');

  if (!globalTest) {
    throw new NotFoundError("Global test template not found");
  }

  const targetLabId = req.user.role === 'system_admin'
    ? (req.body.laboratoryId || req.query.laboratoryId || req.headers['x-laboratory-id'])
    : req.user.laboratoryId;

  if (!targetLabId) {
    throw new BadRequestError("Target laboratory ID is required");
  }

  const localTest = await Test.findOne({
    laboratoryId: targetLabId,
    sourceTestId: globalTest._id,
    isGlobal: false,
    deleted: { $ne: true },
  });

  if (!localTest) {
    throw new NotFoundError("No imported laboratory test found corresponding to this global template.");
  }

  const globalVersion = globalTest.version || 1;
  const currentImportedVersion = localTest.importedVersion || 1;

  if (currentImportedVersion >= globalVersion) {
    return res.status(200).json({
      success: true,
      alreadyUpToDate: true,
      message: "This test is already up to date with the latest global version.",
      test: localTest,
    });
  }

  // Map sub-tests from global template, preserving existing local parameter prices by name or index
  const localSubTestMap = new Map();
  (localTest.subTests || []).forEach(st => {
    if (st.name) localSubTestMap.set(st.name.trim().toLowerCase(), st.price);
  });

  // Step 1: Create updated sub-tests with new explicit ObjectIds first
  const updatedSubTests = globalTest.subTests.map((st, idx) => {
    const stObj = typeof st.toObject === 'function' ? st.toObject() : { ...st };
    stObj._id = new mongoose.Types.ObjectId();

    const lowerName = stObj.name ? stObj.name.trim().toLowerCase() : '';
    if (localSubTestMap.has(lowerName)) {
      stObj.price = localSubTestMap.get(lowerName);
    } else if (localTest.subTests && localTest.subTests[idx] && localTest.subTests[idx].price !== undefined) {
      stObj.price = localTest.subTests[idx].price;
    }

    return stObj;
  });

  // Step 2, 3 & 4: Remap formula references using oldId -> newId mapping & validate
  remapSubTestFormulas(globalTest.subTests, updatedSubTests);

  localTest.name = globalTest.name;
  localTest.departmentId = globalTest.departmentId?._id || globalTest.departmentId;
  localTest.subTests = updatedSubTests;
  localTest.importedVersion = globalVersion;
  localTest.lastUpdatedFromGlobalAt = new Date();
  localTest.updatedBy = req.user._id;

  await localTest.save();

  const populatedTest = await Test.findById(localTest._id)
    .populate('departmentId')
    .populate('createdBy', 'username _id')
    .populate('updatedBy', 'username _id');

  await invalidateCachePattern("*test*");

  res.status(200).json({
    success: true,
    alreadyUpToDate: false,
    test: populatedTest,
    message: `Successfully updated "${globalTest.name}" to version ${globalVersion}!`,
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
  updateImportedGlobalTest,
};
