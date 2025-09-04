import { describe, it, expect } from 'vitest';
import {
  getTodoStatusInfo,
  getTodoStatusStyles,
  getFormattedDueDateWithStatus,
  getFormattedReminderText,
  sortTodosByPriority,
  filterTodosByStatus,
  groupTodosByStatus,
  getTodoStatusSummary,
  todoNeedsAttention,
  getTodoCssClasses,
} from './todoStatusHelpers.js';
import type { Todo } from '../types/todo.js';

// Helper to create test todos
const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'test-id',
  title: 'Test Todo',
  description: 'Test description',
  completed: false,
  createdAt: new Date('2025-01-15T10:00:00.000Z'),
  updatedAt: new Date('2025-01-15T10:00:00.000Z'),
  ...overrides,
});

describe('todoStatusHelpers', () => {
  describe('getTodoStatusInfo', () => {
    it('should return overdue status for past due date', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z') // Past date
      });
      const statusInfo = getTodoStatusInfo(todo);
      
      expect(statusInfo.status).toBe('overdue');
      expect(statusInfo.style.className).toBe('todo-overdue');
      expect(statusInfo.style.color).toBe('#dc2626');
      expect(statusInfo.label).toBe('Overdue');
      expect(statusInfo.priority).toBe(4);
      expect(statusInfo.style.icon).toBe('⚠️');
    });

    it('should return due-soon status for dates within 24 hours', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-15T18:00:00.000Z') // 6 hours from TEST_DATE
      });
      const statusInfo = getTodoStatusInfo(todo);
      
      expect(statusInfo.status).toBe('due-soon');
      expect(statusInfo.style.className).toBe('todo-due-soon');
      expect(statusInfo.style.color).toBe('#d97706');
      expect(statusInfo.label).toBe('Due Soon');
      expect(statusInfo.priority).toBe(3);
      expect(statusInfo.style.icon).toBe('⏰');
    });

    it('should return upcoming status for future dates', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-17T12:00:00.000Z') // 2 days from TEST_DATE
      });
      const statusInfo = getTodoStatusInfo(todo);
      
      expect(statusInfo.status).toBe('upcoming');
      expect(statusInfo.style.className).toBe('todo-upcoming');
      expect(statusInfo.style.color).toBe('#059669');
      expect(statusInfo.label).toBe('Upcoming');
      expect(statusInfo.priority).toBe(2);
      expect(statusInfo.style.icon).toBe('📅');
    });

    it('should return no-due-date status for todos without due date', () => {
      const todo = createTodo({ dueDate: undefined });
      const statusInfo = getTodoStatusInfo(todo);
      
      expect(statusInfo.status).toBe('no-due-date');
      expect(statusInfo.style.className).toBe('todo-no-due-date');
      expect(statusInfo.style.color).toBe('#6b7280');
      expect(statusInfo.label).toBe('No Due Date');
      expect(statusInfo.priority).toBe(1);
      expect(statusInfo.style.icon).toBe('');
    });
  });

  describe('getTodoStatusStyles', () => {
    it('should return correct CSS properties for overdue todo', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z') 
      });
      const styles = getTodoStatusStyles(todo);
      
      expect(styles.color).toBe('#dc2626');
      expect(styles.backgroundColor).toBe('#fef2f2');
      expect(styles.borderColor).toBe('#fca5a5');
    });

    it('should return minimal styles for no-due-date todo', () => {
      const todo = createTodo({ dueDate: undefined });
      const styles = getTodoStatusStyles(todo);
      
      expect(styles.color).toBe('#6b7280');
      expect(styles.backgroundColor).toBeUndefined();
      expect(styles.borderColor).toBeUndefined();
    });
  });

  describe('getFormattedDueDateWithStatus', () => {
    it('should return "No due date" for todos without due date', () => {
      const todo = createTodo({ dueDate: undefined });
      const formatted = getFormattedDueDateWithStatus(todo);
      
      expect(formatted).toBe('No due date');
    });

    it('should prefix "Overdue" for overdue todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z') 
      });
      const formatted = getFormattedDueDateWithStatus(todo);
      
      expect(formatted).toMatch(/^Overdue/);
    });

    it('should prefix "Due" for due-soon todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-15T18:00:00.000Z')
      });
      const formatted = getFormattedDueDateWithStatus(todo);
      
      expect(formatted).toMatch(/^Due/);
    });

    it('should prefix "Due" for upcoming todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-17T12:00:00.000Z')
      });
      const formatted = getFormattedDueDateWithStatus(todo);
      
      expect(formatted).toMatch(/^Due/);
    });

    it('should respect format type parameter', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-16T12:00:00.000Z') 
      });
      const formatted = getFormattedDueDateWithStatus(todo, 'absolute');
      
      expect(formatted).toContain('Jan 16, 2025');
    });
  });

  describe('getFormattedReminderText', () => {
    it('should return null for todos without reminder time', () => {
      const todo = createTodo({ reminderTime: undefined });
      const formatted = getFormattedReminderText(todo);
      
      expect(formatted).toBeNull();
    });

    it('should format reminder time with "Reminder" prefix', () => {
      const todo = createTodo({ 
        reminderTime: new Date('2025-01-16T10:00:00.000Z') 
      });
      const formatted = getFormattedReminderText(todo);
      
      expect(formatted).toMatch(/^Reminder/);
    });
  });

  describe('sortTodosByPriority', () => {
    it('should sort todos by priority (overdue first)', () => {
      const todos = [
        createTodo({ 
          id: '1',
          dueDate: new Date('2025-01-17T12:00:00.000Z') // upcoming
        }),
        createTodo({ 
          id: '2',
          dueDate: new Date('2025-01-14T12:00:00.000Z') // overdue
        }),
        createTodo({ 
          id: '3',
          dueDate: new Date('2025-01-15T18:00:00.000Z') // due soon
        }),
        createTodo({ 
          id: '4',
          dueDate: undefined // no due date
        }),
      ];

      const sorted = sortTodosByPriority(todos);
      
      expect(sorted[0].id).toBe('2'); // overdue first
      expect(sorted[1].id).toBe('3'); // due soon second
      expect(sorted[2].id).toBe('1'); // upcoming third
      expect(sorted[3].id).toBe('4'); // no due date last
    });

    it('should sort by due date within same priority level', () => {
      const todos = [
        createTodo({ 
          id: '1',
          dueDate: new Date('2025-01-18T12:00:00.000Z') // later upcoming
        }),
        createTodo({ 
          id: '2',
          dueDate: new Date('2025-01-17T12:00:00.000Z') // earlier upcoming
        }),
      ];

      const sorted = sortTodosByPriority(todos);
      
      expect(sorted[0].id).toBe('2'); // earlier due date first
      expect(sorted[1].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const todos = [createTodo({ id: '1' }), createTodo({ id: '2' })];
      const originalLength = todos.length;
      
      sortTodosByPriority(todos);
      
      expect(todos.length).toBe(originalLength);
    });
  });

  describe('filterTodosByStatus', () => {
    it('should filter todos by status', () => {
      const todos = [
        createTodo({ 
          id: '1',
          dueDate: new Date('2025-01-14T12:00:00.000Z') // overdue
        }),
        createTodo({ 
          id: '2',
          dueDate: new Date('2025-01-17T12:00:00.000Z') // upcoming
        }),
        createTodo({ 
          id: '3',
          dueDate: undefined // no due date
        }),
      ];

      const overdueTodos = filterTodosByStatus(todos, 'overdue');
      const upcomingTodos = filterTodosByStatus(todos, 'upcoming');
      const noDueDateTodos = filterTodosByStatus(todos, 'no-due-date');

      expect(overdueTodos).toHaveLength(1);
      expect(overdueTodos[0].id).toBe('1');
      
      expect(upcomingTodos).toHaveLength(1);
      expect(upcomingTodos[0].id).toBe('2');
      
      expect(noDueDateTodos).toHaveLength(1);
      expect(noDueDateTodos[0].id).toBe('3');
    });
  });

  describe('groupTodosByStatus', () => {
    it('should group todos by status', () => {
      const todos = [
        createTodo({ 
          id: '1',
          dueDate: new Date('2025-01-14T12:00:00.000Z') // overdue
        }),
        createTodo({ 
          id: '2',
          dueDate: new Date('2025-01-15T18:00:00.000Z') // due soon
        }),
        createTodo({ 
          id: '3',
          dueDate: new Date('2025-01-17T12:00:00.000Z') // upcoming
        }),
        createTodo({ 
          id: '4',
          dueDate: undefined // no due date
        }),
      ];

      const grouped = groupTodosByStatus(todos);

      expect(grouped.overdue).toHaveLength(1);
      expect(grouped.overdue[0].id).toBe('1');
      
      expect(grouped['due-soon']).toHaveLength(1);
      expect(grouped['due-soon'][0].id).toBe('2');
      
      expect(grouped.upcoming).toHaveLength(1);
      expect(grouped.upcoming[0].id).toBe('3');
      
      expect(grouped['no-due-date']).toHaveLength(1);
      expect(grouped['no-due-date'][0].id).toBe('4');
    });
  });

  describe('getTodoStatusSummary', () => {
    it('should count todos by status, excluding completed ones', () => {
      const todos = [
        createTodo({ 
          dueDate: new Date('2025-01-14T12:00:00.000Z'), // overdue
          completed: false
        }),
        createTodo({ 
          dueDate: new Date('2025-01-14T12:00:00.000Z'), // overdue but completed
          completed: true
        }),
        createTodo({ 
          dueDate: new Date('2025-01-15T18:00:00.000Z'), // due soon
          completed: false
        }),
        createTodo({ 
          dueDate: undefined, // no due date
          completed: false
        }),
      ];

      const summary = getTodoStatusSummary(todos);

      expect(summary.overdue).toBe(1); // Only incomplete overdue todo
      expect(summary['due-soon']).toBe(1);
      expect(summary.upcoming).toBe(0);
      expect(summary['no-due-date']).toBe(1);
    });
  });

  describe('todoNeedsAttention', () => {
    it('should return true for overdue incomplete todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z'),
        completed: false
      });
      
      expect(todoNeedsAttention(todo)).toBe(true);
    });

    it('should return true for due-soon incomplete todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-15T18:00:00.000Z'),
        completed: false
      });
      
      expect(todoNeedsAttention(todo)).toBe(true);
    });

    it('should return false for completed todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z'),
        completed: true
      });
      
      expect(todoNeedsAttention(todo)).toBe(false);
    });

    it('should return false for upcoming todos', () => {
      const todo = createTodo({ 
        dueDate: new Date('2025-01-17T12:00:00.000Z'),
        completed: false
      });
      
      expect(todoNeedsAttention(todo)).toBe(false);
    });

    it('should return false for todos without due date', () => {
      const todo = createTodo({ 
        dueDate: undefined,
        completed: false
      });
      
      expect(todoNeedsAttention(todo)).toBe(false);
    });
  });

  describe('getTodoCssClasses', () => {
    it('should return basic classes for regular todo', () => {
      const todo = createTodo({ dueDate: undefined });
      const classes = getTodoCssClasses(todo);
      
      expect(classes).toContain('todo-item');
      expect(classes).toContain('todo-no-due-date');
      expect(classes).not.toContain('todo-completed');
    });

    it('should include completed class for completed todos', () => {
      const todo = createTodo({ completed: true });
      const classes = getTodoCssClasses(todo);
      
      expect(classes).toContain('todo-item');
      expect(classes).toContain('todo-completed');
    });

    it('should include status-specific class', () => {
      const overdueTodo = createTodo({ 
        dueDate: new Date('2025-01-14T12:00:00.000Z') 
      });
      const classes = getTodoCssClasses(overdueTodo);
      
      expect(classes).toContain('todo-item');
      expect(classes).toContain('todo-overdue');
    });

    it('should include additional classes', () => {
      const todo = createTodo();
      const classes = getTodoCssClasses(todo, ['custom-class', 'another-class']);
      
      expect(classes).toContain('todo-item');
      expect(classes).toContain('custom-class');
      expect(classes).toContain('another-class');
    });

    it('should filter out empty classes', () => {
      const todo = createTodo();
      const classes = getTodoCssClasses(todo, ['valid-class', '', 'another-valid']);
      
      expect(classes).toContain('valid-class');
      expect(classes).toContain('another-valid');
      expect(classes.split(' ')).not.toContain('');
    });
  });
});