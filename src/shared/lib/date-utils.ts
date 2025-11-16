/**
 * Date Utility Functions
 * Ensures valid date handling across the application
 */

/**
 * Ensures a value is a valid Date object
 * Falls back to current date if invalid
 */
export function ensureValidDate(value: unknown): Date {
  // If already a valid Date instance
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  // Try to parse as date
  if (value !== null && value !== undefined) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Log error for debugging
  console.error(
    '[DateUtils] Invalid date value:',
    value,
    'falling back to current date'
  );

  // Fallback to current date
  return new Date();
}

/**
 * Safely format a date value
 */
export function formatDate(
  value: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = ensureValidDate(value);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Safely format a date and time value
 */
export function formatDateTime(
  value: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = ensureValidDate(value);
  return date.toLocaleString(undefined, options);
}

/**
 * Get time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(value: unknown): string {
  const date = ensureValidDate(value);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}

/**
 * Validate that a timestamp is reasonable (not too far in past or future)
 */
export function isReasonableDate(value: unknown): boolean {
  const date = ensureValidDate(value);
  const now = new Date();

  // Check if date is between 2020 and 10 years in the future
  const minDate = new Date('2020-01-01');
  const maxDate = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

  return date >= minDate && date <= maxDate;
}

/**
 * Sort array of objects by date field
 */
export function sortByDate<T>(
  array: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aDate = ensureValidDate(a[dateField]);
    const bDate = ensureValidDate(b[dateField]);

    const diff = aDate.getTime() - bDate.getTime();
    return order === 'asc' ? diff : -diff;
  });
}
