import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateValidation, dateValidation } from './useDateValidation.js';
import { TEST_DATE } from '../test/setup.js';

describe('useDateValidation', () => {
  describe('validateDueDate', () => {
    it('should validate null date as valid', () => {
      const { result } = renderHook(() => useDateValidation());
      const validation = result.current.validateDueDate(null);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should validate future date as valid', () => {
      const { result } = renderHook(() => useDateValidation());
      const futureDate = new Date('2025-01-16T12:00:00.000Z');
      const validation = result.current.validateDueDate(futureDate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should invalidate past date when allowPastDates is false', () => {
      const { result } = renderHook(() => useDateValidation({ allowPastDates: false }));
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      const validation = result.current.validateDueDate(pastDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('past-date');
      expect(validation.message).toContain('past');
    });

    it('should validate past date when allowPastDates is true', () => {
      const { result } = renderHook(() => useDateValidation({ allowPastDates: true }));
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      const validation = result.current.validateDueDate(pastDate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should invalidate date too far in future', () => {
      const { result } = renderHook(() => useDateValidation({ maxFutureDays: 30 }));
      const farFutureDate = new Date('2025-03-01T12:00:00.000Z'); // More than 30 days from TEST_DATE
      const validation = result.current.validateDueDate(farFutureDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('due-too-far-future');
      expect(validation.message).toContain('30 days');
    });

    it('should invalidate invalid date', () => {
      const { result } = renderHook(() => useDateValidation());
      const invalidDate = new Date('invalid');
      const validation = result.current.validateDueDate(invalidDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('invalid-date');
    });

    it('should handle ISO string input', () => {
      const { result } = renderHook(() => useDateValidation());
      const futureDateString = '2025-01-16T12:00:00.000Z';
      const validation = result.current.validateDueDate(futureDateString);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('validateReminderTime', () => {
    const futureDueDate = new Date('2025-01-16T12:00:00.000Z');

    it('should validate null reminder time as valid', () => {
      const { result } = renderHook(() => useDateValidation());
      const validation = result.current.validateReminderTime(null, futureDueDate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should validate reminder time before due date and in future', () => {
      const { result } = renderHook(() => useDateValidation());
      const reminderTime = new Date('2025-01-16T10:00:00.000Z'); // 2 hours before due
      const validation = result.current.validateReminderTime(reminderTime, futureDueDate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should invalidate reminder time in the past', () => {
      const { result } = renderHook(() => useDateValidation());
      const pastReminderTime = new Date('2025-01-14T10:00:00.000Z');
      const validation = result.current.validateReminderTime(pastReminderTime, futureDueDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('reminder-in-past');
    });

    it('should invalidate reminder time after due date', () => {
      const { result } = renderHook(() => useDateValidation());
      const lateReminderTime = new Date('2025-01-16T14:00:00.000Z'); // 2 hours after due
      const validation = result.current.validateReminderTime(lateReminderTime, futureDueDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('reminder-after-due');
    });

    it('should allow reminder after due date when requireReminderBeforeDue is false', () => {
      const { result } = renderHook(() => 
        useDateValidation({ requireReminderBeforeDue: false })
      );
      const lateReminderTime = new Date('2025-01-16T14:00:00.000Z');
      const validation = result.current.validateReminderTime(lateReminderTime, futureDueDate);
      
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('should invalidate invalid reminder time', () => {
      const { result } = renderHook(() => useDateValidation());
      const invalidReminderTime = new Date('invalid');
      const validation = result.current.validateReminderTime(invalidReminderTime, futureDueDate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('invalid-date');
    });
  });

  describe('validateDatePair', () => {
    it('should validate both dates and return combined result', () => {
      const { result } = renderHook(() => useDateValidation());
      const dueDate = new Date('2025-01-16T12:00:00.000Z');
      const reminderTime = new Date('2025-01-16T10:00:00.000Z');
      
      const validation = result.current.validateDatePair(dueDate, reminderTime);
      
      expect(validation.isValid).toBe(true);
      expect(validation.dueDate.isValid).toBe(true);
      expect(validation.reminderTime.isValid).toBe(true);
    });

    it('should return false for isValid when either date is invalid', () => {
      const { result } = renderHook(() => useDateValidation());
      const pastDueDate = new Date('2025-01-14T12:00:00.000Z'); // Past date
      const reminderTime = new Date('2025-01-14T10:00:00.000Z'); // Also in past, so invalid reminder
      
      const validation = result.current.validateDatePair(pastDueDate, reminderTime);
      
      expect(validation.isValid).toBe(false);
      expect(validation.dueDate.isValid).toBe(false);
      expect(validation.reminderTime.isValid).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return appropriate error messages', () => {
      const { result } = renderHook(() => useDateValidation());
      const getErrorMessage = result.current.getErrorMessage;
      
      expect(getErrorMessage('invalid-date')).toContain('valid date');
      expect(getErrorMessage('past-date')).toContain('past');
      expect(getErrorMessage('reminder-after-due')).toContain('before due date');
      expect(getErrorMessage('reminder-in-past')).toContain('past');
      expect(getErrorMessage('due-too-far-future')).toContain('far in the future');
      expect(getErrorMessage(null)).toBe('');
    });
  });
});

describe('dateValidation utility functions', () => {
  describe('isDueDateValid', () => {
    it('should return true for null date', () => {
      expect(dateValidation.isDueDateValid(null)).toBe(true);
    });

    it('should return true for future date', () => {
      const futureDate = new Date('2025-01-16T12:00:00.000Z');
      expect(dateValidation.isDueDateValid(futureDate)).toBe(true);
    });

    it('should return false for past date when allowPastDates is false', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      expect(dateValidation.isDueDateValid(pastDate, false)).toBe(false);
    });

    it('should return true for past date when allowPastDates is true', () => {
      const pastDate = new Date('2025-01-14T12:00:00.000Z');
      expect(dateValidation.isDueDateValid(pastDate, true)).toBe(true);
    });

    it('should return false for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(dateValidation.isDueDateValid(invalidDate)).toBe(false);
    });

    it('should handle ISO string input', () => {
      const futureDateString = '2025-01-16T12:00:00.000Z';
      expect(dateValidation.isDueDateValid(futureDateString)).toBe(true);
    });
  });

  describe('isReminderTimeValid', () => {
    const futureDueDate = new Date('2025-01-16T12:00:00.000Z');

    it('should return true for null reminder time', () => {
      expect(dateValidation.isReminderTimeValid(null, futureDueDate)).toBe(true);
    });

    it('should return true for valid reminder time', () => {
      const reminderTime = new Date('2025-01-16T10:00:00.000Z');
      expect(dateValidation.isReminderTimeValid(reminderTime, futureDueDate)).toBe(true);
    });

    it('should return false for reminder time in past', () => {
      const pastReminderTime = new Date('2025-01-14T10:00:00.000Z');
      expect(dateValidation.isReminderTimeValid(pastReminderTime, futureDueDate)).toBe(false);
    });

    it('should return false for reminder time after due date', () => {
      const lateReminderTime = new Date('2025-01-16T14:00:00.000Z');
      expect(dateValidation.isReminderTimeValid(lateReminderTime, futureDueDate)).toBe(false);
    });

    it('should return false for invalid reminder time', () => {
      const invalidReminderTime = new Date('invalid');
      expect(dateValidation.isReminderTimeValid(invalidReminderTime, futureDueDate)).toBe(false);
    });

    it('should handle ISO string inputs', () => {
      const reminderTimeString = '2025-01-16T10:00:00.000Z';
      const dueDateString = '2025-01-16T12:00:00.000Z';
      expect(dateValidation.isReminderTimeValid(reminderTimeString, dueDateString)).toBe(true);
    });
  });
});