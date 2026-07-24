/**
 * Utility to check if a laboratory result value is outside its normal reference range.
 * Single source of truth for abnormal result calculation across editor, preview, and print.
 *
 * @param {string|number} value - Result value
 * @param {string} referenceRange - Reference range string (e.g. "12-17", "12.0 - 17.0", "< 200", "> 50")
 * @param {boolean} isListParameter - True if parameter uses "Convert to List"
 * @returns {{ isAbnormal: boolean, formattedValue: string, status: 'normal' | 'low' | 'high' }}
 */
export const checkAbnormalResult = (value, referenceRange, isListParameter = false) => {
  // 1. If parameter uses "Convert to List", ignore numeric comparison
  if (isListParameter) {
    return { isAbnormal: false, formattedValue: value ?? "", status: 'normal' };
  }

  // 2. Check for empty or non-value inputs
  if (value === null || value === undefined || value === "") {
    return { isAbnormal: false, formattedValue: "", status: 'normal' };
  }

  const valStr = String(value).trim();
  const rangeStr = String(referenceRange || "").trim();

  // 3. Ignore empty ranges or non-numeric reference range strings (e.g. None, Positive/Negative, etc.)
  if (!rangeStr || rangeStr === '-' || /^(none|positive\/negative|n\/a|nil)$/i.test(rangeStr)) {
    return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
  }

  // 4. Ignore non-numeric result values (e.g. Positive, Negative, Reactive, Text blocks)
  if (!/^-?\d+(?:\.\d+)?$/.test(valStr)) {
    return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
  }

  const numValue = parseFloat(valStr);
  if (isNaN(numValue)) {
    return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
  }

  // 5. Handle "< X" or "<= X" (e.g. "< 200", "<= 150")
  const lessThanMatch = rangeStr.match(/^<\s*=?\s*(-?\d+(?:\.\d+)?)$/);
  if (lessThanMatch) {
    const maxVal = parseFloat(lessThanMatch[1]);
    if (!isNaN(maxVal) && numValue > maxVal) {
      return { isAbnormal: true, formattedValue: valStr, status: 'high' };
    }
    return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
  }

  // 6. Handle "> X" or ">= X" (e.g. "> 50", ">= 10")
  const greaterThanMatch = rangeStr.match(/^>\s*=?\s*(-?\d+(?:\.\d+)?)$/);
  if (greaterThanMatch) {
    const minVal = parseFloat(greaterThanMatch[1]);
    if (!isNaN(minVal) && numValue < minVal) {
      return { isAbnormal: true, formattedValue: valStr, status: 'low' };
    }
    return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
  }

  // 7. Handle Min-Max range (e.g. "12-17", "12.0 - 17.0", "12 – 17", "-10 to 5", "-15 - -5")
  const rangeMatch = rangeStr.match(/^(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)$/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (numValue < min) {
        return { isAbnormal: true, formattedValue: valStr, status: 'low' };
      } else if (numValue > max) {
        return { isAbnormal: true, formattedValue: valStr, status: 'high' };
      }
    }
  }

  return { isAbnormal: false, formattedValue: valStr, status: 'normal' };
};
