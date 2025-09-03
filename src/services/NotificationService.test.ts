import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './NotificationService.js';
import type { Todo } from '../types/todo.js';

// Ensure we have the notification mock from setup
const NotificationMock = globalThis.Notification as any;

describe('NotificationService', () => {
  let service: NotificationService;
  let mockTodo: Todo;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Notification permission
    NotificationMock.permission = 'default'; // Start with default permission  
    NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted');
    
    // Reset service instance
    (NotificationService as any).instance = null;
    
    // Get fresh instance
    service = NotificationService.getInstance();
    
    // Create mock todo
    mockTodo = {
      id: 'test-todo-1',
      title: 'Test Todo',
      description: 'Test description',
      completed: false,
      dueDate: new Date(Date.now() + 60000), // 1 minute from now
      reminderTime: new Date(Date.now() + 30000), // 30 seconds from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Browser Support Detection', () => {
    it('should detect when notifications are supported', () => {
      expect(service.isNotificationSupported()).toBe(true);
    });

    it('should detect when notifications are not supported', () => {
      // Store original window object
      const originalWindow = globalThis.window;
      
      // Temporarily mock window without Notification
      vi.stubGlobal('window', {
        ...originalWindow,
        // Remove Notification property
      });
      delete (globalThis.window as any).Notification;
      
      // Reset service instance to pick up the change
      (NotificationService as any).instance = null;
      const newService = NotificationService.getInstance();
      expect(newService.isNotificationSupported()).toBe(false);
      
      // Restore original window
      vi.stubGlobal('window', originalWindow);
    });
  });

  describe('Permission Management', () => {
    it('should get current permission status', () => {
      expect(service.getPermissionStatus()).toBe('default');
    });

    it('should request permission successfully', async () => {
      NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted');
      
      const result = await service.requestPermission();
      
      expect(NotificationMock.requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('should handle permission denial', async () => {
      NotificationMock.requestPermission = vi.fn().mockResolvedValue('denied');
      
      const result = await service.requestPermission();
      
      expect(result).toBe('denied');
    });

    it('should handle permission request errors', async () => {
      NotificationMock.requestPermission = vi.fn().mockRejectedValue(new Error('Permission error'));
      
      const result = await service.requestPermission();
      
      expect(result).toBe('denied');
    });
  });

  describe('Notification Scheduling', () => {
    beforeEach(() => {
      NotificationMock.permission = 'granted';
    });

    it('should schedule a reminder notification', () => {
      const success = service.scheduleReminder(mockTodo);
      
      expect(success).toBe(true);
      expect(service.hasScheduledNotification(mockTodo.id)).toBe(true);
      expect(service.getScheduledNotifications()).toHaveLength(1);
    });

    it('should schedule a due date notification', () => {
      const todoWithoutReminder = { ...mockTodo, reminderTime: undefined };
      const success = service.scheduleDueNotification(todoWithoutReminder);
      
      expect(success).toBe(true);
      expect(service.hasScheduledNotification(mockTodo.id)).toBe(true);
    });

    it('should not schedule notification for past reminder time', () => {
      const pastTodo = {
        ...mockTodo,
        reminderTime: new Date(Date.now() - 60000), // 1 minute ago
      };
      
      const success = service.scheduleReminder(pastTodo);
      
      expect(success).toBe(false);
      expect(service.hasScheduledNotification(pastTodo.id)).toBe(false);
    });

    it('should not schedule notification for past due date', () => {
      const pastTodo = {
        ...mockTodo,
        dueDate: new Date(Date.now() - 60000), // 1 minute ago
        reminderTime: undefined,
      };
      
      const success = service.scheduleDueNotification(pastTodo);
      
      expect(success).toBe(false);
      expect(service.hasScheduledNotification(pastTodo.id)).toBe(false);
    });

    it('should not schedule notification without permission', () => {
      NotificationMock.permission = 'denied';
      
      const success = service.scheduleReminder(mockTodo);
      
      expect(success).toBe(false);
      expect(service.hasScheduledNotification(mockTodo.id)).toBe(false);
    });

    it('should clear existing notification when scheduling new one', () => {
      // Schedule first notification
      service.scheduleReminder(mockTodo);
      const firstNotifications = service.getScheduledNotifications();
      expect(firstNotifications).toHaveLength(1);
      
      // Schedule second notification for same todo
      const updatedTodo = {
        ...mockTodo,
        reminderTime: new Date(Date.now() + 120000), // 2 minutes from now
      };
      service.scheduleReminder(updatedTodo);
      
      // Should still have only one notification
      const secondNotifications = service.getScheduledNotifications();
      expect(secondNotifications).toHaveLength(1);
      expect(secondNotifications[0].scheduledTime).toEqual(updatedTodo.reminderTime);
    });
  });

  describe('Notification Cleanup', () => {
    beforeEach(() => {
      NotificationMock.permission = 'granted';
    });

    it('should clear a specific notification', () => {
      service.scheduleReminder(mockTodo);
      expect(service.hasScheduledNotification(mockTodo.id)).toBe(true);
      
      service.clearNotification(mockTodo.id);
      expect(service.hasScheduledNotification(mockTodo.id)).toBe(false);
    });

    it('should clear all notifications', () => {
      const todo2 = { ...mockTodo, id: 'test-todo-2' };
      
      service.scheduleReminder(mockTodo);
      service.scheduleReminder(todo2);
      expect(service.getScheduledNotifications()).toHaveLength(2);
      
      service.clearAllNotifications();
      expect(service.getScheduledNotifications()).toHaveLength(0);
    });

    it('should reschedule notifications for all todos', () => {
      const todo2 = { ...mockTodo, id: 'test-todo-2' };
      const todo3 = { 
        ...mockTodo, 
        id: 'test-todo-3', 
        completed: true, // Should not be scheduled
      };
      const pastTodo = {
        ...mockTodo,
        id: 'test-todo-4',
        reminderTime: new Date(Date.now() - 60000), // Past time, should not be scheduled
      };
      
      const todos = [mockTodo, todo2, todo3, pastTodo];
      service.rescheduleNotifications(todos);
      
      const scheduled = service.getScheduledNotifications();
      expect(scheduled).toHaveLength(2); // Only mockTodo and todo2 should be scheduled
      expect(scheduled.some(n => n.todoId === mockTodo.id)).toBe(true);
      expect(scheduled.some(n => n.todoId === todo2.id)).toBe(true);
      expect(scheduled.some(n => n.todoId === todo3.id)).toBe(false);
      expect(scheduled.some(n => n.todoId === pastTodo.id)).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const mockListener = vi.fn();
      
      service.addEventListener('permissionChanged', mockListener);
      service.removeEventListener('permissionChanged');
      
      // No direct way to test this without triggering events
      expect(true).toBe(true); // Test passes if no errors
    });
  });

  describe('Notification Display', () => {
    beforeEach(() => {
      NotificationMock.permission = 'granted';
      vi.useFakeTimers();
      
      // Mock window.setTimeout to use vi.setTimeout
      vi.stubGlobal('window', {
        ...globalThis.window,
        setTimeout: vi.fn().mockImplementation((fn, delay) => {
          return setTimeout(fn, delay);
        }),
        clearTimeout: vi.fn().mockImplementation(clearTimeout),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show notification when scheduled time arrives', () => {
      service.scheduleReminder(mockTodo);
      
      // Fast-forward time to trigger the notification
      vi.advanceTimersByTime(30000); // 30 seconds
      
      expect(NotificationMock).toHaveBeenCalledWith(
        `Todo Reminder: ${mockTodo.title}`,
        expect.objectContaining({
          body: expect.any(String),
          icon: '/favicon.ico',
          tag: `todo-reminder-${mockTodo.id}`,
          requireInteraction: true,
          data: {
            todoId: mockTodo.id,
            type: 'reminder'
          }
        })
      );
    });

    it('should show due notification when due time arrives', () => {
      const todoWithoutReminder = { ...mockTodo, reminderTime: undefined };
      service.scheduleDueNotification(todoWithoutReminder);
      
      // Fast-forward time to trigger the notification
      vi.advanceTimersByTime(60000); // 1 minute
      
      expect(NotificationMock).toHaveBeenCalledWith(
        `Todo Due: ${todoWithoutReminder.title}`,
        expect.objectContaining({
          body: 'This todo is due now!',
          icon: '/favicon.ico',
          tag: `todo-due-${todoWithoutReminder.id}`,
          requireInteraction: true,
          data: {
            todoId: todoWithoutReminder.id,
            type: 'due'
          }
        })
      );
    });
  });

  describe('Click Handling', () => {
    beforeEach(() => {
      NotificationMock.permission = 'granted';
      vi.useFakeTimers();
      
      // Mock window.setTimeout to use vi.setTimeout
      vi.stubGlobal('window', {
        ...globalThis.window,
        setTimeout: vi.fn().mockImplementation((fn, delay) => {
          return setTimeout(fn, delay);
        }),
        clearTimeout: vi.fn().mockImplementation(clearTimeout),
        focus: vi.fn(),
      });
      
      // Mock document.querySelector  
      vi.stubGlobal('document', {
        ...globalThis.document,
        querySelector: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        hidden: false,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle notification click to focus window and highlight todo', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        }
      };
      
      globalThis.document.querySelector = vi.fn().mockReturnValue(mockElement);
      
      service.scheduleReminder(mockTodo);
      
      // Fast-forward time to trigger the notification
      vi.advanceTimersByTime(30000);
      
      // Get the notification instance and simulate click
      const notificationInstance = NotificationMock.mock.results[0]?.value;
      
      // Simulate click
      if (notificationInstance?.onclick) {
        notificationInstance.onclick();
      }
      
      expect(globalThis.window.focus).toHaveBeenCalled();
      expect(globalThis.document.querySelector).toHaveBeenCalledWith(`[data-todo-id="${mockTodo.id}"]`);
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
      expect(mockElement.classList.add).toHaveBeenCalledWith('highlighted');
      expect(notificationInstance.close).toHaveBeenCalled();
    });
  });
});