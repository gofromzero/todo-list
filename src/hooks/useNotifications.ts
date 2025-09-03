import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/NotificationService.js';
import type { 
  NotificationPermission, 
  ScheduledNotification 
} from '../services/NotificationService.js';
import type { Todo } from '../types/todo.js';

export interface UseNotificationsState {
  /** Current notification permission status */
  permission: NotificationPermission;
  /** Whether browser supports notifications */
  isSupported: boolean;
  /** Currently scheduled notifications */
  scheduledNotifications: ScheduledNotification[];
  /** Whether permission is being requested */
  isRequestingPermission: boolean;
  /** Error state */
  error: string | null;
}

export interface UseNotificationsActions {
  /** Request notification permission */
  requestPermission: () => Promise<NotificationPermission>;
  /** Schedule a reminder notification for a todo */
  scheduleReminder: (todo: Todo) => boolean;
  /** Schedule a due date notification for a todo */
  scheduleDueNotification: (todo: Todo) => boolean;
  /** Clear notification for a specific todo */
  clearNotification: (todoId: string) => void;
  /** Clear all scheduled notifications */
  clearAllNotifications: () => void;
  /** Reschedule notifications for all todos */
  rescheduleNotifications: (todos: Todo[]) => void;
  /** Check if a todo has a scheduled notification */
  hasScheduledNotification: (todoId: string) => boolean;
  /** Clear error state */
  clearError: () => void;
}

export interface UseNotificationsOptions {
  /** Whether to auto-request permission on mount */
  autoRequestPermission?: boolean;
  /** Callback when a notification fires */
  onNotificationFired?: (todoId: string) => void;
  /** Callback when permission changes */
  onPermissionChange?: (permission: NotificationPermission) => void;
}

/**
 * Custom hook for managing notifications
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): [UseNotificationsState, UseNotificationsActions] {
  const { 
    autoRequestPermission = false,
    onNotificationFired,
    onPermissionChange 
  } = options;

  const [state, setState] = useState<UseNotificationsState>({
    permission: notificationService.getPermissionStatus(),
    isSupported: notificationService.isNotificationSupported(),
    scheduledNotifications: notificationService.getScheduledNotifications(),
    isRequestingPermission: false,
    error: null,
  });

  // Update scheduled notifications
  const updateScheduledNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      scheduledNotifications: notificationService.getScheduledNotifications(),
    }));
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    setState(prev => ({ ...prev, isRequestingPermission: true, error: null }));
    
    try {
      const permission = await notificationService.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isRequestingPermission: false,
        error: permission === 'denied' 
          ? 'Notification permission was denied. You can enable it in browser settings.' 
          : null,
      }));
      
      return permission;
    } catch (error) {
      const errorMessage = 'Failed to request notification permission';
      setState(prev => ({
        ...prev,
        isRequestingPermission: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  // Schedule reminder
  const scheduleReminder = useCallback((todo: Todo): boolean => {
    try {
      const success = notificationService.scheduleReminder(todo);
      if (success) {
        updateScheduledNotifications();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to schedule reminder for "${todo.title}"`,
      }));
      return false;
    }
  }, [updateScheduledNotifications]);

  // Schedule due notification
  const scheduleDueNotification = useCallback((todo: Todo): boolean => {
    try {
      const success = notificationService.scheduleDueNotification(todo);
      if (success) {
        updateScheduledNotifications();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to schedule due notification for "${todo.title}"`,
      }));
      return false;
    }
  }, [updateScheduledNotifications]);

  // Clear notification
  const clearNotification = useCallback((todoId: string): void => {
    try {
      notificationService.clearNotification(todoId);
      updateScheduledNotifications();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to clear notification',
      }));
    }
  }, [updateScheduledNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback((): void => {
    try {
      notificationService.clearAllNotifications();
      updateScheduledNotifications();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to clear all notifications',
      }));
    }
  }, [updateScheduledNotifications]);

  // Reschedule notifications
  const rescheduleNotifications = useCallback((todos: Todo[]): void => {
    try {
      notificationService.rescheduleNotifications(todos);
      updateScheduledNotifications();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to reschedule notifications',
      }));
    }
  }, [updateScheduledNotifications]);

  // Check if todo has scheduled notification
  const hasScheduledNotification = useCallback((todoId: string): boolean => {
    return notificationService.hasScheduledNotification(todoId);
  }, []);

  // Clear error
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handlePermissionChanged = (permission: NotificationPermission) => {
      setState(prev => ({ ...prev, permission }));
      onPermissionChange?.(permission);
    };

    const handleNotificationScheduled = () => {
      updateScheduledNotifications();
    };

    const handleNotificationFired = (todoId: string) => {
      updateScheduledNotifications();
      onNotificationFired?.(todoId);
    };

    const handleNotificationCleared = () => {
      updateScheduledNotifications();
    };

    // Add event listeners
    notificationService.addEventListener('permissionChanged', handlePermissionChanged);
    notificationService.addEventListener('notificationScheduled', handleNotificationScheduled);
    notificationService.addEventListener('notificationFired', handleNotificationFired);
    notificationService.addEventListener('notificationCleared', handleNotificationCleared);

    return () => {
      // Clean up event listeners
      notificationService.removeEventListener('permissionChanged');
      notificationService.removeEventListener('notificationScheduled');
      notificationService.removeEventListener('notificationFired');
      notificationService.removeEventListener('notificationCleared');
    };
  }, [updateScheduledNotifications, onNotificationFired, onPermissionChange]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequestPermission && state.permission === 'default' && state.isSupported) {
      requestPermission().catch(console.error);
    }
  }, [autoRequestPermission, state.permission, state.isSupported, requestPermission]);

  const actions: UseNotificationsActions = {
    requestPermission,
    scheduleReminder,
    scheduleDueNotification,
    clearNotification,
    clearAllNotifications,
    rescheduleNotifications,
    hasScheduledNotification,
    clearError,
  };

  return [state, actions];
}