/**
 * Custom hook for fetching employee data using React Query
 * Handles caching, loading states, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAIEmployeeStore } from '@/stores/ai-employee-store';
import type { AIEmployee } from '@/types/ai-employee';

interface UseEmployeeOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export const useEmployee = (employeeId: string, options: UseEmployeeOptions = {}) => {
  const { employees, loadEmployee } = useAIEmployeeStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      await loadEmployee(employeeId);
      return employees[employeeId];
    },
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (updates: Partial<AIEmployee>) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...employees[employeeId], ...updates };
    },
    onSuccess: (updatedEmployee) => {
      // Update the cache
      queryClient.setQueryData(['employee', employeeId], updatedEmployee);
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries(['employee', employeeId]);
    },
  });

  return {
    employee: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
  };
};

export const useEmployees = (options: UseEmployeeOptions = {}) => {
  const { employees, loadEmployees } = useAIEmployeeStore();

  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      await loadEmployees();
      return Object.values(employees);
    },
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes
    cacheTime: options.cacheTime ?? 5 * 60 * 1000, // 5 minutes
  });
};
