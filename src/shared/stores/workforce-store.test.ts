/**
 * Workforce Store Unit Tests
 * Tests for the workforce management store (hired employees)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock auth store first (before any imports)
const mockUser = { id: 'test-user-123', email: 'test@example.com' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('./authentication-store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: currentUser,
    })),
    subscribe: vi.fn(() => () => {}), // Return unsubscribe function
  },
}));

// Create chainable mock factory
const createChainableMock = (resolvedValue: unknown) => {
  const mockFn = vi.fn(() => Promise.resolve(resolvedValue));
  return {
    eq: vi.fn().mockReturnThis(),
    order: mockFn,
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockFn,
        }),
        order: mockFn,
      }),
      maybeSingle: vi.fn(() => Promise.resolve(resolvedValue)),
    }),
    maybeSingle: vi.fn(() => Promise.resolve(resolvedValue)),
  };
};

// Mock Supabase client
let mockSupabaseResponse: { data: unknown; error: unknown } = {
  data: [],
  error: null,
};

vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => {
      const chainable = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve(mockSupabaseResponse)),
            })),
          })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve(mockSupabaseResponse)),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(mockSupabaseResponse)),
          })),
        })),
      };
      return chainable;
    }),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

// Import after mocks are set up
import { useWorkforceStore } from './workforce-store';

describe('Workforce Store', () => {
  const mockEmployee = {
    id: 'emp-1',
    user_id: 'test-user-123',
    employee_id: 'code-reviewer',
    name: 'Code Reviewer',
    role: 'reviewer',
    provider: 'anthropic',
    is_active: true,
    purchased_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the store
    useWorkforceStore.getState().reset();

    // Reset user to authenticated state
    currentUser = mockUser;

    // Reset mock response
    mockSupabaseResponse = { data: [], error: null };

    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty state', () => {
      useWorkforceStore.getState().reset();
      const state = useWorkforceStore.getState();

      expect(state.hiredEmployees).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchHiredEmployees', () => {
    it('should fetch employees for authenticated user', async () => {
      mockSupabaseResponse = { data: [mockEmployee], error: null };

      await useWorkforceStore.getState().fetchHiredEmployees();

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees).toHaveLength(1);
      expect(state.hiredEmployees[0].name).toBe('Code Reviewer');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle no authenticated user', async () => {
      currentUser = null;

      await useWorkforceStore.getState().fetchHiredEmployees();

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      mockSupabaseResponse = { data: null, error: { message: 'Database error' } };

      await useWorkforceStore.getState().fetchHiredEmployees();

      const state = useWorkforceStore.getState();
      expect(state.error).toBe('Database error');
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;

      // Create a delayed response to capture loading state
      const originalFrom = vi.mocked(
        (await import('@shared/lib/supabase-client')).supabase.from
      );
      originalFrom.mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => {
                loadingDuringFetch = useWorkforceStore.getState().isLoading;
                return { data: [], error: null };
              }),
            })),
          })),
        })),
        upsert: vi.fn(),
        update: vi.fn(),
      }));

      await useWorkforceStore.getState().fetchHiredEmployees();

      expect(loadingDuringFetch).toBe(true);
      expect(useWorkforceStore.getState().isLoading).toBe(false);
    });
  });

  describe('addHiredEmployee', () => {
    it('should add employee to state', () => {
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees).toHaveLength(1);
      expect(state.hiredEmployees[0]).toEqual(mockEmployee);
    });

    it('should add employee at the beginning of the list', () => {
      const employee1 = { ...mockEmployee, id: 'emp-1', name: 'Employee 1' };
      const employee2 = { ...mockEmployee, id: 'emp-2', name: 'Employee 2' };

      useWorkforceStore.getState().addHiredEmployee(employee1);
      useWorkforceStore.getState().addHiredEmployee(employee2);

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees[0].name).toBe('Employee 2');
      expect(state.hiredEmployees[1].name).toBe('Employee 1');
    });
  });

  describe('hireEmployee', () => {
    it('should hire employee successfully', async () => {
      const params = {
        employee_id: 'new-employee',
        name: 'New Employee',
        role: 'developer',
        provider: 'openai',
      };

      const hiredEmployee = {
        ...mockEmployee,
        ...params,
        id: 'new-emp-id',
      };

      mockSupabaseResponse = { data: hiredEmployee, error: null };

      const result = await useWorkforceStore.getState().hireEmployee(params);

      expect(result).toEqual(hiredEmployee);

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees).toContainEqual(hiredEmployee);
      expect(state.isLoading).toBe(false);
    });

    it('should handle hire failure', async () => {
      mockSupabaseResponse = { data: null, error: { message: 'Hire failed' } };

      const result = await useWorkforceStore.getState().hireEmployee({
        employee_id: 'emp-1',
        name: 'Employee',
        role: 'developer',
        provider: 'openai',
      });

      expect(result).toBeNull();
      expect(useWorkforceStore.getState().error).toBe('Hire failed');
    });

    it('should not add duplicate employees', async () => {
      // First, add an employee to the store
      useWorkforceStore.getState().addHiredEmployee({
        ...mockEmployee,
        employee_id: 'existing-employee',
      });

      const hiredEmployee = {
        ...mockEmployee,
        employee_id: 'existing-employee',
      };

      mockSupabaseResponse = { data: hiredEmployee, error: null };

      await useWorkforceStore.getState().hireEmployee({
        employee_id: 'existing-employee',
        name: 'Employee',
        role: 'developer',
        provider: 'openai',
      });

      const state = useWorkforceStore.getState();
      // Should not have duplicates
      const matchingEmployees = state.hiredEmployees.filter(
        (e) => e.employee_id === 'existing-employee'
      );
      expect(matchingEmployees).toHaveLength(1);
    });

    it('should require authentication', async () => {
      currentUser = null;

      const result = await useWorkforceStore.getState().hireEmployee({
        employee_id: 'emp-1',
        name: 'Employee',
        role: 'developer',
        provider: 'openai',
      });

      expect(result).toBeNull();
      expect(useWorkforceStore.getState().error).toBe('User not authenticated');
    });
  });

  describe('removeHiredEmployee', () => {
    it('should remove employee from state', () => {
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);
      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(1);

      useWorkforceStore
        .getState()
        .removeHiredEmployee(mockEmployee.employee_id);

      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(0);
    });

    it('should handle non-existent employee', () => {
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);

      // Should not throw
      expect(() => {
        useWorkforceStore.getState().removeHiredEmployee('non-existent');
      }).not.toThrow();

      // Original employee should still be there
      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(1);
    });
  });

  describe('fireEmployee', () => {
    it('should fire employee successfully', async () => {
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);

      mockSupabaseResponse = { data: null, error: null };

      const result = await useWorkforceStore
        .getState()
        .fireEmployee(mockEmployee.employee_id);

      expect(result).toBe(true);
      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(0);
    });

    it('should handle fire failure', async () => {
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);

      mockSupabaseResponse = { data: null, error: { message: 'Fire failed' } };

      const result = await useWorkforceStore
        .getState()
        .fireEmployee(mockEmployee.employee_id);

      expect(result).toBe(false);
      expect(useWorkforceStore.getState().error).toBe('Fire failed');
      // Employee should still be in the list
      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(1);
    });

    it('should require authentication', async () => {
      currentUser = null;

      const result = await useWorkforceStore.getState().fireEmployee('emp-1');

      expect(result).toBe(false);
      expect(useWorkforceStore.getState().error).toBe('User not authenticated');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Set an error first
      useWorkforceStore.setState({ error: 'Some error' });
      expect(useWorkforceStore.getState().error).toBe('Some error');

      useWorkforceStore.getState().clearError();

      expect(useWorkforceStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      useWorkforceStore.getState().addHiredEmployee(mockEmployee);
      useWorkforceStore.setState({ error: 'Error', isLoading: true });

      // Reset
      useWorkforceStore.getState().reset();

      const state = useWorkforceStore.getState();
      expect(state.hiredEmployees).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty employee list', async () => {
      mockSupabaseResponse = { data: [], error: null };

      await useWorkforceStore.getState().fetchHiredEmployees();

      expect(useWorkforceStore.getState().hiredEmployees).toEqual([]);
    });

    it('should handle null data from fetch', async () => {
      mockSupabaseResponse = { data: null, error: null };

      await useWorkforceStore.getState().fetchHiredEmployees();

      expect(useWorkforceStore.getState().hiredEmployees).toEqual([]);
    });

    it('should handle unexpected errors in fetchHiredEmployees', async () => {
      const { supabase } = await import('@shared/lib/supabase-client');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await useWorkforceStore.getState().fetchHiredEmployees();

      expect(useWorkforceStore.getState().error).toBe('Unexpected error');
    });

    it('should handle unexpected errors in hireEmployee', async () => {
      const { supabase } = await import('@shared/lib/supabase-client');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw new Error('Unexpected hire error');
      });

      const result = await useWorkforceStore.getState().hireEmployee({
        employee_id: 'emp-1',
        name: 'Employee',
        role: 'developer',
        provider: 'openai',
      });

      expect(result).toBeNull();
      expect(useWorkforceStore.getState().error).toBe('Unexpected hire error');
    });

    it('should handle unexpected errors in fireEmployee', async () => {
      const { supabase } = await import('@shared/lib/supabase-client');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw new Error('Unexpected fire error');
      });

      const result = await useWorkforceStore.getState().fireEmployee('emp-1');

      expect(result).toBe(false);
      expect(useWorkforceStore.getState().error).toBe('Unexpected fire error');
    });
  });

  describe('Performance', () => {
    it('should handle large employee lists', async () => {
      const largeList = Array.from({ length: 100 }, (_, i) => ({
        ...mockEmployee,
        id: `emp-${i}`,
        employee_id: `employee-${i}`,
        name: `Employee ${i}`,
      }));

      mockSupabaseResponse = { data: largeList, error: null };

      const start = performance.now();
      await useWorkforceStore.getState().fetchHiredEmployees();
      const end = performance.now();

      expect(useWorkforceStore.getState().hiredEmployees).toHaveLength(100);
      expect(end - start).toBeLessThan(100); // Should be fast
    });
  });
});
