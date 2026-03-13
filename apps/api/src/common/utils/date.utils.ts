/**
 * Timezone-aware date utilities.
 *
 * All habit-log dates and streak calculations must resolve "today"
 * relative to the user's timezone, not the server's clock.
 */

/**
 * Get the current date string (YYYY-MM-DD) in the given IANA timezone.
 * Falls back to UTC if the timezone is invalid.
 *
 * @example getTodayInTimezone('Europe/Warsaw') => '2026-03-13'
 */
export function getTodayInTimezone(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone);
}

/**
 * Format a Date object as YYYY-MM-DD in the given IANA timezone.
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  try {
    // Intl.DateTimeFormat resolves the date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA locale produces YYYY-MM-DD format
    return formatter.format(date);
  } catch {
    // Invalid timezone — fall back to UTC
    return date.toISOString().split('T')[0];
  }
}

/**
 * Get the current day-of-week (0=Sun, 1=Mon, ..., 6=Sat) in the given timezone.
 */
export function getDayOfWeekInTimezone(timezone: string): number {
  const dateStr = getTodayInTimezone(timezone);
  const d = new Date(dateStr + 'T12:00:00Z'); // noon UTC to avoid DST edge cases
  return d.getUTCDay();
}
