import '@testing-library/jest-dom';

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