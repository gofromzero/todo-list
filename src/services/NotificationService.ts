import { formatDate } from '../utils/dateHelpers.js';
import type { Todo } from '../types/todo.js';

/**
 * Interface for scheduled notification data
 */
export interface ScheduledNotification {
  id: string;
  todoId: string;
  timeoutId: number;
  scheduledTime: Date;
  title: string;
  type: 'reminder' | 'due';
}

/**
 * Notification permission status
 */
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Notification service events
 */
export interface NotificationServiceEvents {
  permissionChanged: (permission: NotificationPermission) => void;
  notificationScheduled: (notification: ScheduledNotification) => void;
  notificationFired: (todoId: string) => void;
  notificationCleared: (todoId: string) => void;
}

/**
 * Service for managing browser notifications for todo reminders
 */
export class NotificationService {
  private static instance: NotificationService | null = null;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private eventListeners: Partial<NotificationServiceEvents> = {};
  private permissionStatus: NotificationPermission = 'default';
  
  private constructor() {
    this.initializeService();
  }

  /**
   * Get singleton instance of NotificationService
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  private initializeService(): void {
    if (!this.isNotificationSupported()) {
      console.warn('Browser notifications are not supported in this environment');
      return;
    }

    // Get initial permission status
    this.permissionStatus = this.getPermissionStatus();

    // Listen for visibility changes to handle tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for beforeunload to clean up timeouts
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Check if browser supports notifications
   */
  public isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    try {
      return Notification.permission;
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      
      // Emit permission changed event
      this.eventListeners.permissionChanged?.(permission);
      
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Schedule a notification for a todo's reminder time
   */
  public scheduleReminder(todo: Todo): boolean {
    if (!todo.reminderTime || !this.canShowNotifications()) {
      return false;
    }

    const now = new Date();
    const reminderTime = new Date(todo.reminderTime);
    
    // Don't schedule if reminder time has passed
    if (reminderTime <= now) {
      return false;
    }

    // Clear any existing notification for this todo
    this.clearNotification(todo.id);

    const delay = reminderTime.getTime() - now.getTime();
    const notificationId = `reminder-${todo.id}`;

    const timeoutId = window.setTimeout(() => {
      this.showReminderNotification(todo);
    }, delay);

    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      todoId: todo.id,
      timeoutId,
      scheduledTime: reminderTime,
      title: todo.title,
      type: 'reminder'
    };

    this.scheduledNotifications.set(todo.id, scheduledNotification);
    
    // Emit notification scheduled event
    this.eventListeners.notificationScheduled?.(scheduledNotification);
    
    return true;
  }

  /**
   * Schedule a due date notification for a todo
   */
  public scheduleDueNotification(todo: Todo): boolean {
    if (!todo.dueDate || !this.canShowNotifications()) {
      return false;
    }

    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    
    // Don't schedule if due date has passed
    if (dueDate <= now) {
      return false;
    }

    // Clear any existing notification for this todo
    this.clearNotification(todo.id);

    const delay = dueDate.getTime() - now.getTime();
    const notificationId = `due-${todo.id}`;

    const timeoutId = window.setTimeout(() => {
      this.showDueNotification(todo);
    }, delay);

    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      todoId: todo.id,
      timeoutId,
      scheduledTime: dueDate,
      title: todo.title,
      type: 'due'
    };

    this.scheduledNotifications.set(todo.id, scheduledNotification);
    
    // Emit notification scheduled event
    this.eventListeners.notificationScheduled?.(scheduledNotification);
    
    return true;
  }

  /**
   * Clear a scheduled notification for a todo
   */
  public clearNotification(todoId: string): void {
    const scheduledNotification = this.scheduledNotifications.get(todoId);
    
    if (scheduledNotification) {
      clearTimeout(scheduledNotification.timeoutId);
      this.scheduledNotifications.delete(todoId);
      
      // Emit notification cleared event
      this.eventListeners.notificationCleared?.(todoId);
    }
  }

  /**
   * Clear all scheduled notifications
   */
  public clearAllNotifications(): void {
    this.scheduledNotifications.forEach((notification, todoId) => {
      clearTimeout(notification.timeoutId);
    });
    
    this.scheduledNotifications.clear();
  }

  /**
   * Get all scheduled notifications
   */
  public getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * Check if a todo has a scheduled notification
   */
  public hasScheduledNotification(todoId: string): boolean {
    return this.scheduledNotifications.has(todoId);
  }

  /**
   * Show a reminder notification
   */
  private showReminderNotification(todo: Todo): void {
    if (!this.canShowNotifications() || !todo.reminderTime) {
      return;
    }

    const timeUntilDue = todo.dueDate 
      ? `Due ${formatDate(todo.dueDate, 'relative')}`
      : 'Reminder';

    const notification = new Notification(`Todo Reminder: ${todo.title}`, {
      body: timeUntilDue,
      icon: '/favicon.ico',
      tag: `todo-reminder-${todo.id}`,
      requireInteraction: true,
      data: {
        todoId: todo.id,
        type: 'reminder'
      }
    });

    this.setupNotificationHandlers(notification, todo.id);
    
    // Remove from scheduled notifications
    this.scheduledNotifications.delete(todo.id);
    
    // Emit notification fired event
    this.eventListeners.notificationFired?.(todo.id);
  }

  /**
   * Show a due date notification
   */
  private showDueNotification(todo: Todo): void {
    if (!this.canShowNotifications() || !todo.dueDate) {
      return;
    }

    const notification = new Notification(`Todo Due: ${todo.title}`, {
      body: `This todo is due now!`,
      icon: '/favicon.ico',
      tag: `todo-due-${todo.id}`,
      requireInteraction: true,
      data: {
        todoId: todo.id,
        type: 'due'
      }
    });

    this.setupNotificationHandlers(notification, todo.id);
    
    // Remove from scheduled notifications
    this.scheduledNotifications.delete(todo.id);
    
    // Emit notification fired event
    this.eventListeners.notificationFired?.(todo.id);
  }

  /**
   * Setup click and close handlers for notifications
   */
  private setupNotificationHandlers(notification: Notification, todoId: string): void {
    notification.onclick = () => {
      // Focus the window and highlight the todo
      window.focus();
      
      // Scroll to and highlight the todo item
      const todoElement = document.querySelector(`[data-todo-id="${todoId}"]`);
      if (todoElement) {
        todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        todoElement.classList.add('highlighted');
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          todoElement.classList.remove('highlighted');
        }, 3000);
      }
      
      notification.close();
    };

    notification.onclose = () => {
      // Clean up any resources if needed
    };

    notification.onerror = (error) => {
      console.error('Notification error:', error);
    };

    // Auto-close notification after 10 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  /**
   * Check if notifications can be shown
   */
  private canShowNotifications(): boolean {
    return this.isNotificationSupported() && this.getPermissionStatus() === 'granted';
  }

  /**
   * Handle visibility change events
   */
  private handleVisibilityChange(): void {
    // When tab becomes visible, we could refresh scheduled notifications
    // or handle any missed notifications
    if (!document.hidden) {
      // Tab is now visible - opportunity to refresh state
    }
  }

  /**
   * Add event listener
   */
  public addEventListener<K extends keyof NotificationServiceEvents>(
    event: K,
    listener: NotificationServiceEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Remove event listener
   */
  public removeEventListener<K extends keyof NotificationServiceEvents>(
    event: K
  ): void {
    delete this.eventListeners[event];
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.clearAllNotifications();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Reschedule notifications for all todos with reminder times
   */
  public rescheduleNotifications(todos: Todo[]): void {
    // Clear existing notifications first
    this.clearAllNotifications();
    
    // Schedule new notifications for todos with valid reminder times
    todos.forEach(todo => {
      if (!todo.completed && todo.reminderTime) {
        this.scheduleReminder(todo);
      }
      
      if (!todo.completed && todo.dueDate && !todo.reminderTime) {
        // Schedule due notification if no reminder is set
        this.scheduleDueNotification(todo);
      }
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();