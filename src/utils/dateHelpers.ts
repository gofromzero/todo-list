import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isEqual,
  subMinutes,
  subHours,
  subDays,
  addDays,
  startOfDay,
  endOfDay,
  isValid,
  parseISO,
} from 'date-fns';

/**
 * Date formatting options
 */
export type DateFormatType = 'relative' | 'absolute' | 'datetime' | 'date' | 'time';

/**
 * Reminder interval options
 */
export type ReminderInterval = '15min' | '1hr' | '1day' | 'custom';

/**
 * Todo status based on due date
 */
export type TodoDateStatus = 'overdue' | 'due-soon' | 'upcoming' | 'no-due-date';

/**
 * Configuration for "due soon" threshold
 */
const DUE_SOON_HOURS = 24; // Consider todos due within 24 hours as "due soon"

/**
 * Format a date for display based on the specified type
 */
export function formatDate(date: Date | string, type: DateFormatType = 'relative'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  switch (type) {
    case 'relative':
      return formatDistanceToNow(dateObj, { addSuffix: true });
    case 'absolute':
      return format(dateObj, 'MMM d, yyyy');
    case 'datetime':
      return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
    case 'date':
      return format(dateObj, 'yyyy-MM-dd');
    case 'time':
      return format(dateObj, 'h:mm a');
    default:
      return formatDistanceToNow(dateObj, { addSuffix: true });
  }
}

/**
 * Format a date for HTML datetime-local input
 */
export function formatForDateTimeInput(date: Date): string {
  if (!isValid(date)) {
    return '';
  }
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parse a datetime-local input value to Date
 */
export function parseDateTimeInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

/**
 * Check if a date is in the past (overdue)
 */
export function isOverdue(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is due soon (within the next 24 hours)
 */
export function isDueSoon(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  
  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + DUE_SOON_HOURS * 60 * 60 * 1000);
  
  return isAfter(dateObj, now) && isBefore(dateObj, dueSoonThreshold);
}

/**
 * Check if a date is upcoming (more than 24 hours away)
 */
export function isUpcoming(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  
  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + DUE_SOON_HOURS * 60 * 60 * 1000);
  
  return isAfter(dateObj, dueSoonThreshold);
}

/**
 * Get the date status for a todo based on its due date
 */
export function getTodoDateStatus(dueDate?: Date | string): TodoDateStatus {
  if (!dueDate) {
    return 'no-due-date';
  }
  
  if (isOverdue(dueDate)) {
    return 'overdue';
  }
  
  if (isDueSoon(dueDate)) {
    return 'due-soon';
  }
  
  return 'upcoming';
}

/**
 * Calculate reminder time based on due date and interval
 */
export function calculateReminderTime(dueDate: Date, interval: ReminderInterval): Date {
  if (!isValid(dueDate)) {
    throw new Error('Invalid due date provided');
  }

  switch (interval) {
    case '15min':
      return subMinutes(dueDate, 15);
    case '1hr':
      return subHours(dueDate, 1);
    case '1day':
      return subDays(dueDate, 1);
    default:
      throw new Error(`Unsupported reminder interval: ${interval}`);
  }
}

/**
 * Get available reminder interval options
 */
export function getReminderIntervals(): { value: ReminderInterval; label: string }[] {
  return [
    { value: '15min', label: '15 minutes before' },
    { value: '1hr', label: '1 hour before' },
    { value: '1day', label: '1 day before' },
    { value: 'custom', label: 'Custom time' },
  ];
}

/**
 * Check if a reminder time is valid (not in the past)
 */
export function isValidReminderTime(reminderTime: Date, dueDate: Date): boolean {
  if (!isValid(reminderTime) || !isValid(dueDate)) {
    return false;
  }
  
  // Reminder must be before due date and not in the past
  return isBefore(reminderTime, dueDate) && isAfter(reminderTime, new Date());
}

/**
 * Get date range for filtering todos (today, this week, etc.)
 */
export function getDateRange(period: 'today' | 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfDay(now),
        end: endOfDay(addDays(now, 7)), // 7 days from now
      };
    case 'month':
      return {
        start: startOfDay(now),
        end: endOfDay(addDays(now, 30)), // 30 days from now
      };
    default:
      throw new Error(`Unsupported date range period: ${period}`);
  }
}

/**
 * Serialize date to ISO string for storage
 */
export function serializeDate(date: Date | null): string | undefined {
  if (!date || !isValid(date)) {
    return undefined;
  }
  return date.toISOString();
}

/**
 * Deserialize ISO string to Date object
 */
export function deserializeDate(dateString: string | undefined): Date | undefined {
  if (!dateString) {
    return undefined;
  }
  
  const date = parseISO(dateString);
  return isValid(date) ? date : undefined;
}