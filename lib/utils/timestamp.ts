/**
 * Format a Date to PostgreSQL timestamp(3) without time zone format
 * Converts ISO string (with Z) to format without timezone indicator
 * Example: "2024-01-01T12:00:00.000Z" -> "2024-01-01 12:00:00"
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
}

/**
 * Format a Date for PostgreSQL queries (start of day)
 * Example: "2024-01-01 00:00:00"
 */
export function formatDateStart(date: Date): string {
  return date.toISOString().split('T')[0] + ' 00:00:00';
}

/**
 * Format a Date for PostgreSQL queries (end of day)
 * Example: "2024-01-01 23:59:59"
 */
export function formatDateEnd(date: Date): string {
  return date.toISOString().split('T')[0] + ' 23:59:59';
}

/**
 * Get current timestamp in PostgreSQL format
 */
export function getCurrentTimestamp(): string {
  return formatTimestamp(new Date());
}

