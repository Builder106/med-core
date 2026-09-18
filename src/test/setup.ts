import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

export function createMockMediaQueryList(query: string, matches = false): MediaQueryList {
  return {
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

afterEach(() => {
  cleanup();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
  }
});

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => createMockMediaQueryList(query);
}
