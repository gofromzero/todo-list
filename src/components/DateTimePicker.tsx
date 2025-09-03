import React, { useState, useEffect } from 'react';
import { 
  formatForDateTimeInput, 
  parseDateTimeInput, 
  calculateReminderTime,
  getReminderIntervals,
  type ReminderInterval 
} from '../utils/dateHelpers.js';
import { 
  useDateValidation, 
  type DateValidationOptions 
} from '../hooks/useDateValidation.js';

interface DateTimePickerProps {
  /** Current due date value */
  dueDate?: Date | null;
  /** Current reminder time value */
  reminderTime?: Date | null;
  /** Callback when due date changes */
  onDueDateChange: (date: Date | null) => void;
  /** Callback when reminder time changes */
  onReminderTimeChange: (date: Date | null) => void;
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Date validation options */
  validationOptions?: DateValidationOptions;
  /** Label for the due date input */
  dueDateLabel?: string;
  /** Label for the reminder time input */
  reminderLabel?: string;
  /** Show quick reminder interval buttons */
  showReminderIntervals?: boolean;
}

/**
 * Component for selecting due dates and reminder times with validation
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  dueDate,
  reminderTime,
  onDueDateChange,
  onReminderTimeChange,
  disabled = false,
  validationOptions,
  dueDateLabel = 'Due Date',
  reminderLabel = 'Reminder',
  showReminderIntervals = true,
}) => {
  // Local state for input values (as strings for HTML inputs)
  const [dueDateInput, setDueDateInput] = useState(() => 
    dueDate ? formatForDateTimeInput(dueDate) : ''
  );
  const [reminderTimeInput, setReminderTimeInput] = useState(() => 
    reminderTime ? formatForDateTimeInput(reminderTime) : ''
  );

  // Validation hook
  const { validateDatePair } = useDateValidation(validationOptions);

  // Update local state when props change
  useEffect(() => {
    setDueDateInput(dueDate ? formatForDateTimeInput(dueDate) : '');
  }, [dueDate]);

  useEffect(() => {
    setReminderTimeInput(reminderTime ? formatForDateTimeInput(reminderTime) : '');
  }, [reminderTime]);

  // Validate current values
  const validation = validateDatePair(dueDate, reminderTime);

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDueDateInput(value);
    
    const parsedDate = parseDateTimeInput(value);
    onDueDateChange(parsedDate);
  };

  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReminderTimeInput(value);
    
    const parsedDate = parseDateTimeInput(value);
    onReminderTimeChange(parsedDate);
  };

  const handleReminderIntervalClick = (interval: ReminderInterval) => {
    if (!dueDate || interval === 'custom') {
      return;
    }

    try {
      const reminderDate = calculateReminderTime(dueDate, interval);
      onReminderTimeChange(reminderDate);
      setReminderTimeInput(formatForDateTimeInput(reminderDate));
    } catch (error) {
      console.warn('Failed to calculate reminder time:', error);
    }
  };

  const clearDueDate = () => {
    setDueDateInput('');
    onDueDateChange(null);
  };

  const clearReminderTime = () => {
    setReminderTimeInput('');
    onReminderTimeChange(null);
  };

  const reminderIntervals = getReminderIntervals();

  return (
    <div className="datetime-picker">
      {/* Due Date Input */}
      <div className="form-group">
        <label htmlFor="due-date-input" className="form-label">
          {dueDateLabel}
        </label>
        <div className="datetime-input-container">
          <input
            id="due-date-input"
            type="datetime-local"
            value={dueDateInput}
            onChange={handleDueDateChange}
            disabled={disabled}
            className={`datetime-input ${validation.dueDate.isValid ? '' : 'error'}`}
            aria-label={dueDateLabel}
            aria-describedby={validation.dueDate.isValid ? undefined : 'due-date-error'}
          />
          {dueDateInput && (
            <button
              type="button"
              onClick={clearDueDate}
              disabled={disabled}
              className="clear-button"
              aria-label="Clear due date"
            >
              ✕
            </button>
          )}
        </div>
        {!validation.dueDate.isValid && (
          <div id="due-date-error" className="error-message" role="alert">
            {validation.dueDate.message}
          </div>
        )}
      </div>

      {/* Reminder Time Input */}
      <div className="form-group">
        <label htmlFor="reminder-time-input" className="form-label">
          {reminderLabel}
        </label>
        <div className="datetime-input-container">
          <input
            id="reminder-time-input"
            type="datetime-local"
            value={reminderTimeInput}
            onChange={handleReminderTimeChange}
            disabled={disabled}
            className={`datetime-input ${validation.reminderTime.isValid ? '' : 'error'}`}
            aria-label={reminderLabel}
            aria-describedby={validation.reminderTime.isValid ? undefined : 'reminder-time-error'}
          />
          {reminderTimeInput && (
            <button
              type="button"
              onClick={clearReminderTime}
              disabled={disabled}
              className="clear-button"
              aria-label="Clear reminder time"
            >
              ✕
            </button>
          )}
        </div>
        {!validation.reminderTime.isValid && (
          <div id="reminder-time-error" className="error-message" role="alert">
            {validation.reminderTime.message}
          </div>
        )}

        {/* Quick Reminder Intervals */}
        {showReminderIntervals && dueDate && (
          <div className="reminder-intervals">
            <span className="reminder-intervals-label">Quick set:</span>
            {reminderIntervals
              .filter(interval => interval.value !== 'custom')
              .map((interval) => (
                <button
                  key={interval.value}
                  type="button"
                  onClick={() => handleReminderIntervalClick(interval.value)}
                  disabled={disabled}
                  className="reminder-interval-button"
                  aria-label={`Set reminder ${interval.label}`}
                >
                  {interval.label}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simplified date picker component for just due dates
 */
export const DueDatePicker: React.FC<{
  dueDate?: Date | null;
  onDueDateChange: (date: Date | null) => void;
  disabled?: boolean;
  validationOptions?: DateValidationOptions;
  label?: string;
}> = ({ dueDate, onDueDateChange, disabled, validationOptions, label = 'Due Date' }) => {
  return (
    <DateTimePicker
      dueDate={dueDate}
      reminderTime={null}
      onDueDateChange={onDueDateChange}
      onReminderTimeChange={() => {}} // No-op for reminder
      disabled={disabled}
      validationOptions={validationOptions}
      dueDateLabel={label}
      showReminderIntervals={false}
    />
  );
};