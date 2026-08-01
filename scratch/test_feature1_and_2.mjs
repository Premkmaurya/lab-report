import { resolveReferenceRange, validateReferenceRanges, convertToDays } from "../frontend/src/utils/referenceRangeResolver.js";

console.log("=== Testing Reference Range Resolver ===");

const paramWithRules = {
  normalRange: "10-20",
  referenceRanges: [
    {
      ageFrom: 0,
      ageTo: 12,
      ageUnit: "Years",
      gender: "Any",
      referenceRange: "11.0 - 14.0",
    },
    {
      ageFrom: 13,
      ageTo: 150,
      ageUnit: "Years",
      gender: "Male",
      referenceRange: "13.5 - 17.5",
    },
    {
      ageFrom: 13,
      ageTo: 150,
      ageUnit: "Years",
      gender: "Female",
      referenceRange: "12.0 - 15.5",
    },
  ],
};

// Test Case 1: Male 32 Years
const maleAdult = resolveReferenceRange(paramWithRules, { age: 32, ageUnit: "Years", gender: "Male" });
console.log("Male 32 Years Range:", maleAdult);
if (maleAdult !== "13.5 - 17.5") throw new Error(`Expected 13.5 - 17.5 but got ${maleAdult}`);

// Test Case 2: Female 32 Years
const femaleAdult = resolveReferenceRange(paramWithRules, { age: 32, ageUnit: "Years", gender: "Female" });
console.log("Female 32 Years Range:", femaleAdult);
if (femaleAdult !== "12.0 - 15.5") throw new Error(`Expected 12.0 - 15.5 but got ${femaleAdult}`);

// Test Case 3: Child 6 Years
const child = resolveReferenceRange(paramWithRules, { age: 6, ageUnit: "Years", gender: "Female" });
console.log("Child 6 Years Range:", child);
if (child !== "11.0 - 14.0") throw new Error(`Expected 11.0 - 14.0 but got ${child}`);

// Test Case 4: Legacy Fallback
const legacyParam = { normalRange: "5.0 - 10.0" };
const legacyResult = resolveReferenceRange(legacyParam, { age: 40, gender: "Male" });
console.log("Legacy Fallback Range:", legacyResult);
if (legacyResult !== "5.0 - 10.0") throw new Error(`Expected 5.0 - 10.0 but got ${legacyResult}`);

// Test Case 8: Bug 2 Patient Recalculation (Male 25 -> Female 25)
const uricAcidParam = {
  normalRange: "3.5 - 7.0",
  referenceRanges: [
    { ageFrom: 0, ageTo: 120, ageUnit: "Years", gender: "Male", referenceRange: "3.5 - 7.0" },
    { ageFrom: 0, ageTo: 120, ageUnit: "Years", gender: "Female", referenceRange: "2.5 - 5.5" },
  ],
};
let patientObj = { age: 25, gender: "Male" };
const rangeBeforeEdit = resolveReferenceRange(uricAcidParam, patientObj);
console.log("Before Edit (Male 25):", rangeBeforeEdit);
if (rangeBeforeEdit !== "3.5 - 7.0") throw new Error(`Expected 3.5 - 7.0 but got ${rangeBeforeEdit}`);

// Simulate editing patient demographics to Female
patientObj = { ...patientObj, gender: "Female" };
const rangeAfterEdit = resolveReferenceRange(uricAcidParam, patientObj);
console.log("After Edit (Female 25):", rangeAfterEdit);
if (rangeAfterEdit !== "2.5 - 5.5") throw new Error(`Expected 2.5 - 5.5 but got ${rangeAfterEdit}`);

console.log("ALL FEATURE 1 & 2 & BUG RECALCULATION TESTS PASSED SUCCESSFULLY! ✅");
