/**
 * Formats a given date string or Date object into a unified DateTime string
 * Format: DD-MMM-YYYY HH:mm (e.g. 12-May-2026 16:50)
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return "N/A";
  
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) {
    return typeof dateInput === 'string' ? dateInput : "N/A";
  }
  
  const datePart = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
  
  const timePart = dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  return `${datePart} ${timePart}`;
};

/**
 * Formats a given date string or Date object into a Date-only string
 * Format: DD-MMM-YYYY (e.g. 12-May-2026)
 * Usage: Only if specifically requested to exclude time, but default is formatDateTime
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) {
    return typeof dateInput === 'string' ? dateInput : "N/A";
  }
  
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
};

/**
 * Formats a given date string or Date object into a Time-only string
 * Format: HH:mm (e.g. 16:50)
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return "N/A";
  
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) {
    return typeof dateInput === 'string' ? dateInput : "N/A";
  }
  
  return dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
