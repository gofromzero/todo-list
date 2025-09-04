import { useMemo } from 'react';
import { isAfter, isBefore, isValid, parseISO } from 'date-fns';

/**
 * Date validation error types
 */
export type DateValidationError = 
  | 'invalid-date'
  | 'past-date'
  | 'reminder-after-due'
  | 'reminder-in-past'
  | 'due-too-far-future'
  | null;

/**
 * Date validation result
 */
export interface DateValidationResult {
  isValid: boolean;
  error: DateValidationError;
  message: string;
}

/**
 * Date validation options
 */
export interface DateValidationOptions {
  allowPastDates?: boolean;
  maxFutureDays?: number;
  requireReminderBeforeDue?: boolean;
}

/**
 * Hook for validating due dates and reminder times
 */
export function useDateValidation(options: DateValidationOptions = {}) {
  const {
    allowPastDates = false,
    maxFutureDays = 365, // 1 year max
    requireReminderBeforeDue = true,
  } = options;

  const validateDueDate = useMemo(() => {
    return (date: Date | string | null): DateValidationResult => {
      if (!date) {
        return {
          isValid: true,
          error: null,
          message: '',
        };
      }

      const dateObj = typeof date === 'string' ? parseISO(date) : date;

      // Check if date is valid
      if (!isValid(dateObj)) {
        return {
          isValid: false,
          error: 'invalid-date',
          message: 'Please enter a valid date',
        };
      }

      const now = new Date();

      // Check if date is in the past
      if (!allowPastDates && isBefore(dateObj, now)) {
        return {
          isValid: false,
          error: 'past-date',
          message: 'Due date cannot be in the past',
        };
      }

      // Check if date is too far in the future
      if (maxFutureDays > 0) {
        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + maxFutureDays);
        
        if (isAfter(dateObj, maxFutureDate)) {
          return {
            isValid: false,
            error: 'due-too-far-future',
            message: `Due date cannot be more than ${maxFutureDays} days in the future`,
          };
        }
      }

      return {
        isValid: true,
        error: null,
        message: '',
      };
    };
  }, [allowPastDates, maxFutureDays]);

  const validateReminderTime = useMemo(() => {
    return (reminderTime: Date | string | null, dueDate: Date | string | null): DateValidationResult => {
      if (!reminderTime) {
        return {
          isValid: true,
          error: null,
          message: '',
        };
      }

      const reminderObj = typeof reminderTime === 'string' ? parseISO(reminderTime) : reminderTime;

      // Check if reminder time is valid
      if (!isValid(reminderObj)) {
        return {
          isValid: false,
          error: 'invalid-date',
          message: 'Please enter a valid reminder time',
        };
      }

      const now = new Date();

      // Check if reminder time is in the past
      if (isBefore(reminderObj, now)) {
        return {
          isValid: false,
          error: 'reminder-in-past',
          message: 'Reminder time cannot be in the past',
        };
      }

      // If we have a due date, validate against it
      if (dueDate && requireReminderBeforeDue) {
        const dueObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
        
        if (isValid(dueObj) && isAfter(reminderObj, dueObj)) {
          return {
            isValid: false,
            error: 'reminder-after-due',
            message: 'Reminder time must be before due date',
          };
        }
      }

      return {
        isValid: true,
        error: null,
        message: '',
      };
    };
  }, [requireReminderBeforeDue]);

  const validateDatePair = useMemo(() => {
    return (dueDate: Date | string | null, reminderTime: Date | string | null): {
      dueDate: DateValidationResult;
      reminderTime: DateValidationResult;
      isValid: boolean;
    } => {
      const dueDateResult = validateDueDate(dueDate);
      const reminderTimeResult = validateReminderTime(reminderTime, dueDate);

      return {
        dueDate: dueDateResult,
        reminderTime: reminderTimeResult,
        isValid: dueDateResult.isValid && reminderTimeResult.isValid,
      };
    };
  }, [validateDueDate, validateReminderTime]);

  const getErrorMessage = useMemo(() => {
    return (error: DateValidationError): string => {
      switch (error) {
        case 'invalid-date':
          return 'Please enter a valid date';
        case 'past-date':
          return 'Date cannot be in the past';
        case 'reminder-after-due':
          return 'Reminder time must be before due date';
        case 'reminder-in-past':
          return 'Reminder time cannot be in the past';
        case 'due-too-far-future':
          return `Due date is too far in the future`;
        default:
          return '';
      }
    };
  }, []);

  return {
    validateDueDate,
    validateReminderTime,
    validateDatePair,
    getErrorMessage,
  };
}

/**
 * Quick validation functions for use outside of React components
 */
export const dateValidation = {
  isDueDateValid: (date: Date | string | null, allowPastDates = false): boolean => {
    if (!date) return true;
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    
    if (!allowPastDates && isBefore(dateObj, new Date())) return false;
    
    return true;
  },

  isReminderTimeValid: (reminderTime: Date | string | null, dueDate: Date | string | null): boolean => {
    if (!reminderTime) return true;
    
    const reminderObj = typeof reminderTime === 'string' ? parseISO(reminderTime) : reminderTime;
    if (!isValid(reminderObj)) return false;
    
    if (isBefore(reminderObj, new Date())) return false;
    
    if (dueDate) {
      const dueObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
      if (isValid(dueObj) && isAfter(reminderObj, dueObj)) return false;
    }
    
    return true;
  },
};