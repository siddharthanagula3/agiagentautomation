import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Common test utilities
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  });

export const expectToBeInDocument = (text: string | RegExp) => {
  expect(screen.getByText(text)).toBeInTheDocument()
};

export const expectNotToBeInDocument = (text: string | RegExp) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
};

// Mock API responses
export const mockApiResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers(),
});

export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message }),
  text: () => Promise.resolve(JSON.stringify({ error: message })),
  headers: new Headers(),
});

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
};

// Mock WebSocket
export const mockWebSocket = () => {
  const mockWs = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  }

  return mockWs
};