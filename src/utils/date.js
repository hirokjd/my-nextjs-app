// src/utils/date.js

/**
 * Format a date/time string as 'YYYY-MM-DD HH:mm' in UTC
 */
export function formatDateTimeUTC(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d)) return "Invalid Date";
  // Format as 'YYYY-MM-DD HH:mm' in UTC
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hour = String(d.getUTCHours()).padStart(2, '0');
  const minute = String(d.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * Format a date string as 'YYYY-MM-DD' in UTC
 */
export function formatDateUTC(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d)) return "Invalid Date";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a time string as 'HH:mm' in UTC
 */
export function formatTimeUTC(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d)) return "Invalid Date";
  const hour = String(d.getUTCHours()).padStart(2, '0');
  const minute = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
} 