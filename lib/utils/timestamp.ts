/**
 * Format a Date to PostgreSQL timestamp(3) without time zone format
 * Uses local date/time components to avoid timezone shifts
 * Example: "2024-01-01 12:00:00"
 */
export function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format a Date for PostgreSQL queries (start of day)
 * Uses local date components to avoid timezone shifts
 * Example: "2024-01-01 00:00:00"
 */
export function formatDateStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
}

/**
 * Format a Date for PostgreSQL queries (end of day)
 * Uses local date components to avoid timezone shifts
 * Example: "2024-01-01 23:59:59"
 */
export function formatDateEnd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 23:59:59`;
}

/**
 * Get current timestamp in PostgreSQL format
 */
export function getCurrentTimestamp(): string {
  return formatTimestamp(new Date());
}

