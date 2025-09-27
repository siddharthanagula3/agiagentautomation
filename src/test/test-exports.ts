// Re-export commonly used testing utilities
export {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  getByRole,
  getByText,
  queryByText,
  findByText,
} from '@testing-library/react';

export { userEvent } from '@testing-library/user-event';
export { vi } from 'vitest';
export { user } from './user-event';
export { renderWithProviders } from './render-with-providers';