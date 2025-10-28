/**
 * Test setup file
 * Configures the test environment for vitest
 */

import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';

// Cleanup after each test (if using React Testing Library)
afterEach(() => {
  vi.clearAllMocks();
});

// Mock window object for browser-specific tests
if (typeof window === 'undefined') {
  (global as any).window = {
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  };
}
