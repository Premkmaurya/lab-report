export const checkAbnormalResult = (value, referenceRange) => {
  if (value === null || value === undefined || value === "") {
    return { isAbnormal: false, formattedValue: value, status: 'normal' };
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return { isAbnormal: false, formattedValue: value, status: 'normal' };
  }

  const valStr = String(value).trim();
  const rangeStr = String(referenceRange || "").trim();

  if (!rangeStr || rangeStr.toLowerCase() === 'none' || rangeStr === '-' || rangeStr === 'positive/negative') {
    return { isAbnormal: false, formattedValue: value, status: 'normal' };
  }

  const numValue = parseFloat(valStr);
  if (isNaN(numValue)) {
    return { isAbnormal: false, formattedValue: value, status: 'normal' };
  }

  const rangeMatch = rangeStr.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (numValue < min) {
        return { isAbnormal: true, formattedValue: `↓ ${value}`, status: 'low' };
      } else if (numValue > max) {
        return { isAbnormal: true, formattedValue: `↑ ${value}`, status: 'high' };
      }
    }
  }

  return { isAbnormal: false, formattedValue: value, status: 'normal' };
};
