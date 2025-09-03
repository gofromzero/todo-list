import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/NotificationService.js';
import type { NotificationPermission as PermissionStatus } from '../services/NotificationService.js';

export interface NotificationPermissionProps {
  /** Whether to show the permission request UI */
  show?: boolean;
  /** Callback when permission status changes */
  onPermissionChange?: (permission: PermissionStatus) => void;
  /** Custom CSS class */
  className?: string;
}

/**
 * Component for requesting and managing notification permissions
 */
export function NotificationPermission({ 
  show = true,
  onPermissionChange,
  className = '' 
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial permission status
    const initialPermission = notificationService.getPermissionStatus();
    setPermission(initialPermission);
    
    // Listen for permission changes
    const handlePermissionChange = (newPermission: PermissionStatus) => {
      setPermission(newPermission);
      onPermissionChange?.(newPermission);
    };

    notificationService.addEventListener('permissionChanged', handlePermissionChange);

    return () => {
      notificationService.removeEventListener('permissionChanged');
    };
  }, [onPermissionChange]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.requestPermission();
      
      if (result === 'denied') {
        setError('Notification permission was denied. You can enable it in your browser settings.');
      } else if (result === 'granted') {
        setError(null);
      }
    } catch (err) {
      setError('Failed to request notification permission. Please try again.');
      console.error('Permission request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if notifications aren't supported
  if (!notificationService.isNotificationSupported()) {
    return null;
  }

  // Don't show if permission is already granted or if show is false
  if (!show || permission === 'granted') {
    return null;
  }

  return (
    <div className={`notification-permission ${className}`.trim()}>
      <div className="notification-permission-content">
        {permission === 'default' && (
          <>
            <div className="notification-permission-header">
              <svg 
                className="notification-icon" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h3>Enable Notifications</h3>
            </div>
            
            <p className="notification-permission-description">
              Get notified when your todos are due or when reminders are scheduled. 
              We'll only send notifications for todos with due dates or reminder times.
            </p>

            {error && (
              <div className="notification-permission-error" role="alert">
                {error}
              </div>
            )}

            <div className="notification-permission-actions">
              <button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="notification-permission-button primary"
                aria-describedby="notification-permission-description"
              >
                {isLoading ? (
                  <>
                    <svg 
                      className="loading-spinner" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Requesting...
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>
            </div>

            <details className="notification-permission-details">
              <summary>Why do we need this permission?</summary>
              <div className="notification-permission-details-content">
                <p>
                  Notifications help you stay on top of your todos by:
                </p>
                <ul>
                  <li>Reminding you before tasks are due</li>
                  <li>Alerting you when deadlines arrive</li>
                  <li>Working even when the app is in the background</li>
                </ul>
                <p>
                  <strong>Your privacy matters:</strong> All notifications are generated 
                  locally in your browser. No data is sent to external servers.
                </p>
              </div>
            </details>
          </>
        )}

        {permission === 'denied' && (
          <>
            <div className="notification-permission-header">
              <svg 
                className="notification-icon blocked" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m21 2-9 9m0 0L3 2m9 9 9 9M12 11l-9 9" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <h3>Notifications Blocked</h3>
            </div>
            
            <p className="notification-permission-description">
              Notifications are currently blocked. To receive todo reminders, please:
            </p>
            
            <ol className="notification-permission-instructions">
              <li>Click the notification icon in your browser's address bar</li>
              <li>Select "Allow" for notifications</li>
              <li>Refresh this page</li>
            </ol>

            <p className="notification-permission-note">
              You can also enable notifications in your browser settings under 
              "Site Settings" or "Privacy and Security".
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationPermission;