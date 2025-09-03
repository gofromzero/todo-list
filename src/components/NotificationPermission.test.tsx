import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPermission } from './NotificationPermission.js';
import { notificationService } from '../services/NotificationService.js';

// Mock the notification service
vi.mock('../services/NotificationService.js', () => {
  const mockService = {
    isNotificationSupported: vi.fn(() => true),
    getPermissionStatus: vi.fn(() => 'default'),
    requestPermission: vi.fn().mockResolvedValue('granted'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  return {
    notificationService: mockService,
  };
});

const mockNotificationService = notificationService as any;

describe('NotificationPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotificationService.isNotificationSupported.mockReturnValue(true);
    mockNotificationService.getPermissionStatus.mockReturnValue('default');
  });

  describe('Visibility Control', () => {
    it('should render when notifications are supported and permission is default', () => {
      render(<NotificationPermission />);
      
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByText(/Get notified when your todos are due/)).toBeInTheDocument();
    });

    it('should not render when notifications are not supported', () => {
      mockNotificationService.isNotificationSupported.mockReturnValue(false);
      
      render(<NotificationPermission />);
      
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('should not render when permission is already granted', () => {
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');
      
      render(<NotificationPermission />);
      
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('should not render when show prop is false', () => {
      render(<NotificationPermission show={false} />);
      
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('should render when show prop is true and conditions are met', () => {
      render(<NotificationPermission show={true} />);
      
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });
  });

  describe('Permission Request Flow', () => {
    it('should display default permission request UI', () => {
      render(<NotificationPermission />);
      
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByText(/Get notified when your todos are due/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument();
      expect(screen.getByText(/Why do we need this permission?/)).toBeInTheDocument();
    });

    it('should request permission when button is clicked', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockResolvedValue('granted');
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
    });

    it('should show loading state during permission request', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('granted'), 100))
      );
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      expect(screen.getByText('Requesting...')).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText('Requesting...')).not.toBeInTheDocument();
      });
    });

    it('should show error when permission is denied', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockResolvedValue('denied');
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/permission was denied/i)).toBeInTheDocument();
      });
    });

    it('should show error when permission request fails', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockRejectedValue(new Error('Request failed'));
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to request notification permission/i)).toBeInTheDocument();
      });
    });

    it('should call onPermissionChange callback when permission changes', async () => {
      const onPermissionChange = vi.fn();
      mockNotificationService.requestPermission.mockResolvedValue('granted');
      
      render(<NotificationPermission onPermissionChange={onPermissionChange} />);
      
      // Simulate permission change event
      const addEventListenerCall = mockNotificationService.addEventListener.mock.calls
        .find(call => call[0] === 'permissionChanged');
      
      if (addEventListenerCall) {
        const eventHandler = addEventListenerCall[1];
        eventHandler('granted');
        
        expect(onPermissionChange).toHaveBeenCalledWith('granted');
      }
    });
  });

  describe('Permission Denied State', () => {
    beforeEach(() => {
      mockNotificationService.getPermissionStatus.mockReturnValue('denied');
    });

    it('should display denied permission UI', () => {
      render(<NotificationPermission />);
      
      expect(screen.getByText('Notifications Blocked')).toBeInTheDocument();
      expect(screen.getByText(/currently blocked/)).toBeInTheDocument();
      expect(screen.getByText(/Click the notification icon/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
    });

    it('should provide instructions for enabling notifications', () => {
      render(<NotificationPermission />);
      
      expect(screen.getByText(/Click the notification icon in your browser's address bar/)).toBeInTheDocument();
      expect(screen.getByText(/Select "Allow" for notifications/)).toBeInTheDocument();
      expect(screen.getByText(/Refresh this page/)).toBeInTheDocument();
    });
  });

  describe('Details Section', () => {
    it('should show expandable details section', async () => {
      const user = userEvent.setup();
      render(<NotificationPermission />);
      
      const detailsButton = screen.getByText(/Why do we need this permission?/);
      expect(detailsButton).toBeInTheDocument();
      
      // Details content should not be visible initially
      expect(screen.queryByText(/Reminding you before tasks are due/)).not.toBeInTheDocument();
      
      // Click to expand details
      await user.click(detailsButton);
      
      expect(screen.getByText(/Reminding you before tasks are due/)).toBeInTheDocument();
      expect(screen.getByText(/Your privacy matters/)).toBeInTheDocument();
    });

    it('should explain privacy and usage', async () => {
      const user = userEvent.setup();
      render(<NotificationPermission />);
      
      const detailsButton = screen.getByText(/Why do we need this permission?/);
      await user.click(detailsButton);
      
      expect(screen.getByText(/All notifications are generated locally/)).toBeInTheDocument();
      expect(screen.getByText(/No data is sent to external servers/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      expect(button).toHaveAttribute('aria-describedby', 'notification-permission-description');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockResolvedValue('denied');
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(/permission was denied/i);
      });
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<NotificationPermission />);
      
      // Tab to button
      await user.tab();
      expect(screen.getByRole('button', { name: /enable notifications/i })).toHaveFocus();
      
      // Tab to details button
      await user.tab();
      expect(screen.getByText(/Why do we need this permission?/)).toHaveFocus();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <NotificationPermission className="custom-notification-class" />
      );
      
      const notificationElement = container.querySelector('.notification-permission');
      expect(notificationElement).toHaveClass('custom-notification-class');
    });

    it('should combine default and custom classes', () => {
      const { container } = render(
        <NotificationPermission className="custom-class" />
      );
      
      const notificationElement = container.querySelector('.notification-permission');
      expect(notificationElement).toHaveClass('notification-permission');
      expect(notificationElement).toHaveClass('custom-class');
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<NotificationPermission />);
      
      unmount();
      
      expect(mockNotificationService.removeEventListener).toHaveBeenCalledWith('permissionChanged');
    });
  });

  describe('Loading and Error States', () => {
    it('should disable button during loading', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('granted'), 100))
      );
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      expect(button).toBeDisabled();
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show loading spinner during request', async () => {
      const user = userEvent.setup();
      mockNotificationService.requestPermission.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('granted'), 100))
      );
      
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      // Check for loading spinner (look for the SVG with loading-spinner class)
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
      
      await waitFor(() => {
        expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should clear error after successful permission request', async () => {
      const user = userEvent.setup();
      
      // First request fails
      mockNotificationService.requestPermission.mockResolvedValueOnce('denied');
      render(<NotificationPermission />);
      
      const button = screen.getByRole('button', { name: /enable notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/permission was denied/i)).toBeInTheDocument();
      });
      
      // Second request succeeds
      mockNotificationService.requestPermission.mockResolvedValueOnce('granted');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.queryByText(/permission was denied/i)).not.toBeInTheDocument();
      });
    });
  });
});