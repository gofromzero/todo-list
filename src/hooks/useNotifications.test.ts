import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications.js';
import { notificationService } from '../services/NotificationService.js';
import type { Todo } from '../types/todo.js';

// Mock the notification service
vi.mock('../services/NotificationService.js', () => {
  const mockService = {
    getPermissionStatus: vi.fn(() => 'default'),
    isNotificationSupported: vi.fn(() => true),
    getScheduledNotifications: vi.fn(() => []),
    requestPermission: vi.fn().mockResolvedValue('granted'),
    scheduleReminder: vi.fn(() => true),
    scheduleDueNotification: vi.fn(() => true),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
    rescheduleNotifications: vi.fn(),
    hasScheduledNotification: vi.fn(() => false),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  return {
    notificationService: mockService,
    NotificationService: {
      getInstance: () => mockService,
    },
  };
});

const mockNotificationService = notificationService as any;

describe('useNotifications', () => {
  let mockTodo: Todo;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockTodo = {
      id: 'test-todo-1',
      title: 'Test Todo',
      description: 'Test description',
      completed: false,
      dueDate: new Date(Date.now() + 60000),
      reminderTime: new Date(Date.now() + 30000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset mock returns
    mockNotificationService.getPermissionStatus.mockReturnValue('default');
    mockNotificationService.isNotificationSupported.mockReturnValue(true);
    mockNotificationService.getScheduledNotifications.mockReturnValue([]);
    mockNotificationService.hasScheduledNotification.mockReturnValue(false);
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useNotifications());
      const [state] = result.current;

      expect(state).toEqual({
        permission: 'default',
        isSupported: true,
        scheduledNotifications: [],
        isRequestingPermission: false,
        error: null,
      });
    });

    it('should detect when notifications are not supported', () => {
      mockNotificationService.isNotificationSupported.mockReturnValue(false);
      
      const { result } = renderHook(() => useNotifications());
      const [state] = result.current;

      expect(state.isSupported).toBe(false);
    });

    it('should initialize with granted permission', () => {
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');
      
      const { result } = renderHook(() => useNotifications());
      const [state] = result.current;

      expect(state.permission).toBe('granted');
    });
  });

  describe('Permission Management', () => {
    it('should request permission successfully', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('granted');
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      await act(async () => {
        const permission = await actions.requestPermission();
        expect(permission).toBe('granted');
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('denied');
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      await act(async () => {
        await actions.requestPermission();
      });

      const [state] = result.current;
      expect(state.permission).toBe('denied');
      expect(state.error).toContain('denied');
      expect(state.isRequestingPermission).toBe(false);
    });

    it('should handle permission request errors', async () => {
      mockNotificationService.requestPermission.mockRejectedValue(new Error('Request failed'));
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      await act(async () => {
        await expect(actions.requestPermission()).rejects.toThrow('Failed to request notification permission');
      });

      const [state] = result.current;
      expect(state.error).toContain('Failed to request');
      expect(state.isRequestingPermission).toBe(false);
    });

    it('should auto-request permission when enabled', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('granted');
      
      renderHook(() => useNotifications({ autoRequestPermission: true }));

      // Wait for effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
    });

    it('should not auto-request permission when already granted', () => {
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');
      
      renderHook(() => useNotifications({ autoRequestPermission: true }));

      expect(mockNotificationService.requestPermission).not.toHaveBeenCalled();
    });

    it('should not auto-request permission when not supported', () => {
      mockNotificationService.isNotificationSupported.mockReturnValue(false);
      
      renderHook(() => useNotifications({ autoRequestPermission: true }));

      expect(mockNotificationService.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule reminder notification', () => {
      mockNotificationService.scheduleReminder.mockReturnValue(true);
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        const success = actions.scheduleReminder(mockTodo);
        expect(success).toBe(true);
      });

      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledWith(mockTodo);
    });

    it('should handle reminder scheduling failure', () => {
      mockNotificationService.scheduleReminder.mockReturnValue(false);
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        const success = actions.scheduleReminder(mockTodo);
        expect(success).toBe(false);
      });
    });

    it('should handle reminder scheduling error', () => {
      mockNotificationService.scheduleReminder.mockImplementation(() => {
        throw new Error('Scheduling failed');
      });
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        const success = actions.scheduleReminder(mockTodo);
        expect(success).toBe(false);
      });

      const [state] = result.current;
      expect(state.error).toContain('Failed to schedule reminder');
    });

    it('should schedule due notification', () => {
      mockNotificationService.scheduleDueNotification.mockReturnValue(true);
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        const success = actions.scheduleDueNotification(mockTodo);
        expect(success).toBe(true);
      });

      expect(mockNotificationService.scheduleDueNotification).toHaveBeenCalledWith(mockTodo);
    });
  });

  describe('Notification Management', () => {
    it('should clear notification for specific todo', () => {
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        actions.clearNotification('test-todo-1');
      });

      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith('test-todo-1');
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        actions.clearAllNotifications();
      });

      expect(mockNotificationService.clearAllNotifications).toHaveBeenCalled();
    });

    it('should reschedule notifications for todos', () => {
      const todos = [mockTodo];
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      act(() => {
        actions.rescheduleNotifications(todos);
      });

      expect(mockNotificationService.rescheduleNotifications).toHaveBeenCalledWith(todos);
    });

    it('should check if todo has scheduled notification', () => {
      mockNotificationService.hasScheduledNotification.mockReturnValue(true);
      
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      const hasNotification = actions.hasScheduledNotification('test-todo-1');
      
      expect(hasNotification).toBe(true);
      expect(mockNotificationService.hasScheduledNotification).toHaveBeenCalledWith('test-todo-1');
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useNotifications());
      const [, actions] = result.current;

      // First set an error
      mockNotificationService.scheduleReminder.mockImplementation(() => {
        throw new Error('Test error');
      });

      act(() => {
        actions.scheduleReminder(mockTodo);
      });

      let [state] = result.current;
      expect(state.error).toBeTruthy();

      // Then clear the error
      act(() => {
        actions.clearError();
      });

      [state] = result.current;
      expect(state.error).toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should call onPermissionChange callback', () => {
      const onPermissionChange = vi.fn();
      
      renderHook(() => useNotifications({ onPermissionChange }));

      expect(mockNotificationService.addEventListener).toHaveBeenCalledWith(
        'permissionChanged',
        expect.any(Function)
      );

      // Simulate permission change event
      const eventHandler = mockNotificationService.addEventListener.mock.calls
        .find(call => call[0] === 'permissionChanged')?.[1];
      
      if (eventHandler) {
        act(() => {
          eventHandler('granted');
        });
        
        expect(onPermissionChange).toHaveBeenCalledWith('granted');
      }
    });

    it('should call onNotificationFired callback', () => {
      const onNotificationFired = vi.fn();
      
      renderHook(() => useNotifications({ onNotificationFired }));

      expect(mockNotificationService.addEventListener).toHaveBeenCalledWith(
        'notificationFired',
        expect.any(Function)
      );

      // Simulate notification fired event
      const eventHandler = mockNotificationService.addEventListener.mock.calls
        .find(call => call[0] === 'notificationFired')?.[1];
      
      if (eventHandler) {
        act(() => {
          eventHandler('test-todo-1');
        });
        
        expect(onNotificationFired).toHaveBeenCalledWith('test-todo-1');
      }
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useNotifications());

      unmount();

      expect(mockNotificationService.removeEventListener).toHaveBeenCalledWith('permissionChanged');
      expect(mockNotificationService.removeEventListener).toHaveBeenCalledWith('notificationScheduled');
      expect(mockNotificationService.removeEventListener).toHaveBeenCalledWith('notificationFired');
      expect(mockNotificationService.removeEventListener).toHaveBeenCalledWith('notificationCleared');
    });
  });

  describe('Scheduled Notifications State', () => {
    it('should update scheduled notifications when service changes', () => {
      const mockNotifications = [
        {
          id: 'reminder-test-todo-1',
          todoId: 'test-todo-1',
          timeoutId: 123,
          scheduledTime: new Date(),
          title: 'Test Todo',
          type: 'reminder' as const,
        },
      ];

      mockNotificationService.getScheduledNotifications.mockReturnValue(mockNotifications);
      
      const { result } = renderHook(() => useNotifications());

      // Simulate notification scheduled event
      const eventHandler = mockNotificationService.addEventListener.mock.calls
        .find(call => call[0] === 'notificationScheduled')?.[1];
      
      if (eventHandler) {
        act(() => {
          eventHandler(mockNotifications[0]);
        });
      }

      const [state] = result.current;
      expect(state.scheduledNotifications).toEqual(mockNotifications);
    });
  });
});