/**
 * Date utility functions for Skylight MCP
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(timezone?: string): string {
  const date = new Date();
  if (timezone) {
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get a date N days from today in YYYY-MM-DD format
 */
export function getDateOffset(days: number, timezone?: string): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (timezone) {
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get a date N days from a given date string (YYYY-MM-DD) in YYYY-MM-DD format
 */
export function getDateOffsetFrom(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Parse a date string to YYYY-MM-DD format
 * Accepts: YYYY-MM-DD, MM/DD/YYYY, or natural language like "today", "tomorrow"
 */
export function parseDate(input: string, timezone?: string): string {
  const lower = input.toLowerCase().trim();

  // Handle natural language
  if (lower === "today") {
    return getTodayDate(timezone);
  }
  if (lower === "tomorrow") {
    return getDateOffset(1, timezone);
  }
  if (lower === "yesterday") {
    return getDateOffset(-1, timezone);
  }

  // Handle day of week (next occurrence)
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const today = new Date();
    let todayDay: number;
    if (timezone) {
      // Determine the current day-of-week in the configured timezone
      const todayInTz = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(today);
      const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      todayDay = weekdayMap[todayInTz] ?? today.getDay();
    } else {
      todayDay = today.getDay();
    }
    let daysUntil = dayIndex - todayDay;
    if (daysUntil <= 0) {
      daysUntil += 7; // Next week if today or past
    }
    return getDateOffset(daysUntil, timezone);
  }

  // Already in YYYY-MM-DD format - validate month/day ranges
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return input;
    }
    // Invalid month/day, fall through to other parsing attempts
  }

  // MM/DD/YYYY format
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try parsing as a date
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  // Return as-is if we can't parse it
  return input;
}

/**
 * Parse a time string to HH:MM format (24-hour)
 * Accepts: "10:00", "10:00 AM", "2:30 PM", "14:30"
 */
export function parseTime(input: string): string {
  const trimmed = input.trim();

  // Already in HH:MM format (24-hour)
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hoursStr, minutes] = trimmed.split(":");
    const h = parseInt(hoursStr, 10);
    const m = parseInt(minutes, 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      return trimmed;
    }
    return `${hoursStr.padStart(2, "0")}:${minutes}`;
  }

  // 12-hour format with AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    const [, hours, minutes, period] = match;
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h < 1 || h > 12 || m < 0 || m > 59) {
      return trimmed;
    }
    if (period.toUpperCase() === "PM" && h !== 12) {
      h += 12;
    } else if (period.toUpperCase() === "AM" && h === 12) {
      h = 0;
    }
    return `${h.toString().padStart(2, "0")}:${minutes}`;
  }

  // Return as-is
  return trimmed;
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
