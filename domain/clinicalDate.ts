/**
 * Calculates the clinical date string (YYYY-MM-DD) for a given date/timestamp using the 4:00 AM cutoff rule.
 * Any timestamp between 00:00:00 and 03:59:59 is attributed to the previous calendar date.
 */
export function getClinicalDate(input: Date | number | string): string {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input provided to getClinicalDate');
  }

  const hours = date.getHours();

  // If local time is before 04:00:00, subtract one calendar day
  if (hours < 4) {
    date.setDate(date.getDate() - 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
