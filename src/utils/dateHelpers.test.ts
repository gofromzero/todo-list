import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatDate,
  formatForDateTimeInput,
  parseDateTimeInput,
  isOverdue,
  isDueSoon,
  isUpcoming,
  getTodoDateStatus,
  calculateReminderTime,
  getReminderIntervals,
  isValidReminderTime,
  getDateRange,
  serializeDate,
  deserializeDate,
} from './dateHelpers.js';
import { TEST_DATE } from '../test/setup.js';

describe('dateHelpers', () => {
  beforeEach(() => {
    // Reset Date.now mock
    vi.clearAllMocks();
  });

  describe('formatDate', () => {
    const testDate = new Date('2025-01-16T14:30:00.000Z');

    it('should format relative dates correctly', () => {
      const result = formatDate(testDate, 'relative');
      expect(result).toContain('day'); // Should be "in 1 day" relative to TEST_DATE
    });

    it('should format absolute dates correctly', () => {
      const result = formatDate(testDate, 'absolute');
      expect(result).toBe('Jan 16, 2025');
    });

    it('should format datetime correctly', () => {
      const result = formatDate(testDate, 'datetime');
      expect(result).toMatch(/Jan 16, 2025 at \d+:\d+ (AM|PM)/);
    });

    it('should format date only correctly', () => {
      const result = formatDate(testDate, 'date');
      expect(result).toBe('2025-01-16');
    });

    it('should format time only correctly', () => {
      const result = formatDate(testDate, 'time');
      expect(result).toMatch(/\d+:\d+ (AM|PM)/);
    });

    it('should handle ISO string input', () => {
      const result = formatDate(testDate.toISOString(), 'absolute');
      expect(result).toBe('Jan 16, 2025');
    });

    it('should handle invalid dates', () => {
      const result = formatDate(new Date('invalid'), 'absolute');
      expect(result).toBe('Invalid date');
    });
  });

  describe('formatForDateTimeInput', () => {
    it('should format date for HTML datetime-local input', () => {
      const testDate = new Date('2025-01-16T14:30:00.000Z');
      const result = formatForDateTimeInput(testDate);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return empty string for invalid date', () => {
      const result = formatForDateTimeInput(new Date('invalid'));
      expect(result).toBe('');
    });
  });

  describe('parseDateTimeInput', () => {
    it('should parse valid datetime-local input', () => {
      const input = '2025-01-16T14:30';
      const result = parseDateTimeInput(input);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(16);
    });

    it('should return null for empty input', () => {
      const result = parseDateTimeInput('');
      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      const result = parseDateTimeInput('invalid-date');
      expect(result).toBeNull();
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z'); // 1 day before TEST_DATE
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2025-01-16T12:00:00.000Z'); // 1 day after TEST_DATE
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should handle ISO string input', () => {
      const pastDateString = '2025-01-14T12:00:00.000Z';
      expect(isOverdue(pastDateString)).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isOverdue(new Date('invalid'))).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    it('should return true for dates within 24 hours', () => {
      const soonDate = new Date('2025-01-15T18:00:00.000Z'); // 6 hours after TEST_DATE
      expect(isDueSoon(soonDate)).toBe(true);
    });

    it('should return false for dates more than 24 hours away', () => {
      const farDate = new Date('2025-01-17T12:00:00.000Z'); // 2 days after TEST_DATE
      expect(isDueSoon(farDate)).toBe(false);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      expect(isDueSoon(pastDate)).toBe(false);
    });

    it('should handle ISO string input', () => {
      const soonDateString = '2025-01-15T18:00:00.000Z';
      expect(isDueSoon(soonDateString)).toBe(true);
    });
  });

  describe('isUpcoming', () => {
    it('should return true for dates more than 24 hours away', () => {
      const upcomingDate = new Date('2025-01-17T12:00:00.000Z'); // 2 days after TEST_DATE
      expect(isUpcoming(upcomingDate)).toBe(true);
    });

    it('should return false for dates within 24 hours', () => {
      const soonDate = new Date('2025-01-15T18:00:00.000Z'); // 6 hours after TEST_DATE
      expect(isUpcoming(soonDate)).toBe(false);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      expect(isUpcoming(pastDate)).toBe(false);
    });
  });

  describe('getTodoDateStatus', () => {
    it('should return "no-due-date" for undefined date', () => {
      expect(getTodoDateStatus(undefined)).toBe('no-due-date');
    });

    it('should return "overdue" for past dates', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      expect(getTodoDateStatus(pastDate)).toBe('overdue');
    });

    it('should return "due-soon" for dates within 24 hours', () => {
      const soonDate = new Date('2025-01-15T18:00:00.000Z');
      expect(getTodoDateStatus(soonDate)).toBe('due-soon');
    });

    it('should return "upcoming" for dates more than 24 hours away', () => {
      const upcomingDate = new Date('2025-01-17T12:00:00.000Z');
      expect(getTodoDateStatus(upcomingDate)).toBe('upcoming');
    });
  });

  describe('calculateReminderTime', () => {
    const dueDate = new Date('2025-01-16T12:00:00.000Z');

    it('should calculate 15 minute reminder correctly', () => {
      const result = calculateReminderTime(dueDate, '15min');
      expect(result.getTime()).toBe(dueDate.getTime() - 15 * 60 * 1000);
    });

    it('should calculate 1 hour reminder correctly', () => {
      const result = calculateReminderTime(dueDate, '1hr');
      expect(result.getTime()).toBe(dueDate.getTime() - 60 * 60 * 1000);
    });

    it('should calculate 1 day reminder correctly', () => {
      const result = calculateReminderTime(dueDate, '1day');
      expect(result.getTime()).toBe(dueDate.getTime() - 24 * 60 * 60 * 1000);
    });

    it('should throw error for invalid due date', () => {
      expect(() => calculateReminderTime(new Date('invalid'), '15min')).toThrow();
    });

    it('should throw error for unsupported interval', () => {
      expect(() => calculateReminderTime(dueDate, 'invalid' as any)).toThrow();
    });
  });

  describe('getReminderIntervals', () => {
    it('should return all available intervals', () => {
      const intervals = getReminderIntervals();
      expect(intervals).toHaveLength(4);
      expect(intervals.map(i => i.value)).toEqual(['15min', '1hr', '1day', 'custom']);
      expect(intervals.every(i => typeof i.label === 'string')).toBe(true);
    });
  });

  describe('isValidReminderTime', () => {
    const dueDate = new Date('2025-01-16T12:00:00.000Z');

    it('should return true for valid reminder before due date and in future', () => {
      const reminderTime = new Date('2025-01-16T10:00:00.000Z'); // 2 hours before due, in future
      expect(isValidReminderTime(reminderTime, dueDate)).toBe(true);
    });

    it('should return false for reminder after due date', () => {
      const reminderTime = new Date('2025-01-16T14:00:00.000Z'); // 2 hours after due
      expect(isValidReminderTime(reminderTime, dueDate)).toBe(false);
    });

    it('should return false for reminder in the past', () => {
      const reminderTime = new Date('2025-01-14T10:00:00.000Z'); // in the past
      expect(isValidReminderTime(reminderTime, dueDate)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isValidReminderTime(new Date('invalid'), dueDate)).toBe(false);
      const validReminderTime = new Date('2025-01-16T10:00:00.000Z');
      expect(isValidReminderTime(validReminderTime, new Date('invalid'))).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should return correct range for today', () => {
      const range = getDateRange('today');
      expect(range.start.getDate()).toBe(TEST_DATE.getDate());
      expect(range.end.getDate()).toBe(TEST_DATE.getDate());
      expect(range.start.getHours()).toBe(0);
      expect(range.end.getHours()).toBe(23);
    });

    it('should return correct range for week', () => {
      const range = getDateRange('week');
      expect(range.start.getDate()).toBe(TEST_DATE.getDate());
      expect(range.end.getDate()).toBe(TEST_DATE.getDate() + 7);
    });

    it('should return correct range for month', () => {
      const range = getDateRange('month');
      expect(range.start.getDate()).toBe(TEST_DATE.getDate()); // Jan 15
      // Jan 15 + 30 days = Feb 14 (because Jan has 31 days)
      expect(range.end.getDate()).toBe(14); 
      expect(range.end.getMonth()).toBe(1); // February (month 1)
    });

    it('should throw error for invalid period', () => {
      expect(() => getDateRange('invalid' as any)).toThrow();
    });
  });

  describe('serializeDate', () => {
    it('should serialize valid date to ISO string', () => {
      const date = new Date('2025-01-16T12:00:00.000Z');
      const result = serializeDate(date);
      expect(result).toBe('2025-01-16T12:00:00.000Z');
    });

    it('should return undefined for null date', () => {
      const result = serializeDate(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid date', () => {
      const result = serializeDate(new Date('invalid'));
      expect(result).toBeUndefined();
    });
  });

  describe('deserializeDate', () => {
    it('should deserialize valid ISO string to Date', () => {
      const isoString = '2025-01-16T12:00:00.000Z';
      const result = deserializeDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('should return undefined for undefined input', () => {
      const result = deserializeDate(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid ISO string', () => {
      const result = deserializeDate('invalid-date');
      expect(result).toBeUndefined();
    });
  });
});