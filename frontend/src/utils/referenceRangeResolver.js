/**
 * referenceRangeResolver.js
 *
 * Evaluates patient age and gender against parameter reference ranges.
 * 
 * Matching Logic Priority:
 * 1. Exact match on Age + Gender (e.g. Gender === Male or Female)
 * 2. Match on Age + Gender === 'Any'
 * 3. Fallback to legacy single normalRange string
 */

export const convertToDays = (age, unit = "Years") => {
  const numericAge = parseFloat(age);
  if (isNaN(numericAge) || numericAge < 0) return 0;

  const normalizedUnit = (unit || "Years").toLowerCase().trim();
  if (normalizedUnit.startsWith("day")) {
    return numericAge;
  }
  if (normalizedUnit.startsWith("month")) {
    return numericAge * 30.4375;
  }
  // Default: Years
  return numericAge * 365;
};

export const parsePatientAge = (patient) => {
  if (!patient) return { ageInDays: 0, ageNum: 0, ageUnit: "Years" };

  let rawAge = patient.age;
  let rawUnit = patient.ageUnit || "Years";

  if (typeof rawAge === "string") {
    const match = rawAge.trim().match(/^(\d+(?:\.\d+)?)\s*(days?|months?|years?)?$/i);
    if (match) {
      rawAge = parseFloat(match[1]);
      if (match[2]) {
        rawUnit = match[2];
      }
    }
  }

  const ageNum = parseFloat(rawAge) || 0;
  const ageInDays = convertToDays(ageNum, rawUnit);

  return { ageInDays, ageNum, ageUnit: rawUnit };
};

export const resolveReferenceRange = (param, patient) => {
  if (!param) return "";

  const rules =
    param.referenceRanges ||
    param.referenceRangeRules ||
    param.subTestTemplate?.referenceRanges ||
    [];

  const realPatient =
    patient && typeof patient === "object" && (patient.age !== undefined || patient.gender !== undefined)
      ? patient
      : (patient?.patientId && typeof patient.patientId === "object" ? patient.patientId : (patient?.patient || {}));

  if (!Array.isArray(rules) || rules.length === 0) {
    return param.normalRange || "";
  }

  const { ageInDays } = parsePatientAge(realPatient);
  const patientGender = (realPatient?.gender || "Any").trim().toLowerCase();

  // Find all rules where patient's age in days falls within rule ageFrom..ageTo
  const matchingAgeRules = rules.filter((rule) => {
    const fromDays = convertToDays(rule.ageFrom ?? 0, rule.ageUnit || "Years");
    const toDays = convertToDays(rule.ageTo ?? 120, rule.ageUnit || "Years");

    // Allow small epsilon for floating point comparison
    return ageInDays >= fromDays - 0.001 && ageInDays <= toDays + 0.001;
  });

  if (matchingAgeRules.length === 0) {
    return param.normalRange || "";
  }

  // Priority 1: Exact Match on Gender (Male, Female, Child)
  const genderExact = matchingAgeRules.find(
    (rule) =>
      rule.gender &&
      rule.gender.toLowerCase() !== "any" &&
      rule.gender.toLowerCase() === patientGender
  );
  if (genderExact && genderExact.referenceRange) {
    return genderExact.referenceRange;
  }

  // Priority 2: Match on "Child" rule if patient is child or rule is Child
  const childMatch = matchingAgeRules.find(
    (rule) => rule.gender && rule.gender.toLowerCase() === "child"
  );
  if (childMatch && childMatch.referenceRange) {
    return childMatch.referenceRange;
  }

  // Priority 3: Gender = Any
  const genderAny = matchingAgeRules.find(
    (rule) => !rule.gender || rule.gender.toLowerCase() === "any"
  );
  if (genderAny && genderAny.referenceRange) {
    return genderAny.referenceRange;
  }

  // Priority 4: First matching rule with a referenceRange value
  const firstWithRange = matchingAgeRules.find((r) => !!r.referenceRange);
  if (firstWithRange) {
    return firstWithRange.referenceRange;
  }

  // Fallback to legacy single reference range
  return param.normalRange || "";
};

export const validateReferenceRanges = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) return null;

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const fromNum = parseFloat(r.ageFrom);
    const toNum = parseFloat(r.ageTo);

    if (isNaN(fromNum) || fromNum < 0) {
      return `Rule #${i + 1}: Age From cannot be negative or invalid`;
    }
    if (isNaN(toNum) || toNum < 0) {
      return `Rule #${i + 1}: Age To cannot be negative or invalid`;
    }
    if (fromNum > toNum) {
      return `Rule #${i + 1}: Age From (${fromNum}) cannot be greater than Age To (${toNum})`;
    }
    if (!r.referenceRange || !r.referenceRange.trim()) {
      return `Rule #${i + 1}: Reference Range string cannot be empty`;
    }
  }

  // Overlap and Duplicate check
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const r1 = rules[i];
      const r2 = rules[j];

      const g1 = (r1.gender || "Any").toLowerCase();
      const g2 = (r2.gender || "Any").toLowerCase();

      const fromDays1 = convertToDays(r1.ageFrom, r1.ageUnit);
      const toDays1 = convertToDays(r1.ageTo, r1.ageUnit);
      const fromDays2 = convertToDays(r2.ageFrom, r2.ageUnit);
      const toDays2 = convertToDays(r2.ageTo, r2.ageUnit);

      if (g1 === g2 && fromDays1 === fromDays2 && toDays1 === toDays2) {
        return `Duplicate rule detected between Rule #${i + 1} and Rule #${j + 1}`;
      }

      // Overlap only occurs when rules target the same gender/category
      const genderOverlaps = g1 === g2;

      if (genderOverlaps) {
        const ageOverlaps = Math.max(fromDays1, fromDays2) <= Math.min(toDays1, toDays2);

        if (ageOverlaps) {
          return `Overlapping age range detected between Rule #${i + 1} (${r1.ageFrom}-${r1.ageTo} ${r1.ageUnit}, ${r1.gender}) and Rule #${j + 1} (${r2.ageFrom}-${r2.ageTo} ${r2.ageUnit}, ${r2.gender})`;
        }
      }
    }
  }

  return null;
};
