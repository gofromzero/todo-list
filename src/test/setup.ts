import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup global test date for consistent testing
export const TEST_DATE = new Date('2025-01-15T12:00:00.000Z');
export const TEST_DATE_ISO = TEST_DATE.toISOString();

// Mock Date constructor to return consistent "now"
const OriginalDate = globalThis.Date;
globalThis.Date = class extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(TEST_DATE.getTime());
    } else {
      super(...args);
    }
  }
  
  static now(): number {
    return TEST_DATE.getTime();
  }
} as any;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock Notification API globally
const NotificationMock = vi.fn().mockImplementation(() => ({
  onclick: null,
  onclose: null,
  onerror: null,
  close: vi.fn(),
}));

NotificationMock.permission = 'default';
NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted');

// Make sure window object exists with Notification
Object.defineProperty(globalThis, 'window', {
  value: {
    ...globalThis.window,
    Notification: NotificationMock,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    focus: vi.fn(),
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'Notification', {
  value: NotificationMock,
  writable: true,
  configurable: true,
});