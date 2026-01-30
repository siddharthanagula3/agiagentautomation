/**
 * Workforce React Query Hooks
 * Server state management for AI employees and workforce using React Query
 *
 * @module features/workforce/hooks/use-workforce-queries
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import {
  listPurchasedEmployees,
  isEmployeePurchased,
  purchaseEmployee,
  getEmployeeById,
  type PurchasedEmployeeRecord,
} from '../services/employee-database';
import { AI_EMPLOYEES, type AIEmployee } from '@/data/marketplace-employees';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Employee detail with purchase status
 */
export interface EmployeeDetailData {
  employee: AIEmployee;
  isPurchased: boolean;
  purchaseRecord?: PurchasedEmployeeRecord;
}

/**
 * Marketplace filters for employee listing
 */
export interface MarketplaceFilters {
  category?: string;
  search?: string;
  sortBy?: 'name' | 'price' | 'rating' | 'popular';
  provider?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Employee review from database
 */
export interface EmployeeReview {
  id: string;
  userId: string;
  employeeId: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  userName?: string;
  userAvatar?: string;
}

/**
 * Workforce statistics
 */
export interface WorkforceStats {
  totalHired: number;
  activeEmployees: number;
  totalTasksCompleted: number;
  averageRating: number;
  totalTokensUsed: number;
}

/**
 * Helper to get current user
 */
async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all available employees for marketplace
 *
 * @param filters - Optional filters for the marketplace
 * @returns UseQueryResult with array of AIEmployee
 */
export function useMarketplaceEmployees(
  filters?: MarketplaceFilters
): UseQueryResult<AIEmployee[], Error> {
  return useQuery<AIEmployee[], Error>({
    queryKey: queryKeys.employees.marketplace(filters),
    queryFn: async (): Promise<AIEmployee[]> => {
      let employees = [...AI_EMPLOYEES];

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        employees = employees.filter(
          (e) => e.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        employees = employees.filter(
          (e) =>
            e.name.toLowerCase().includes(searchLower) ||
            e.description.toLowerCase().includes(searchLower) ||
            e.role.toLowerCase().includes(searchLower) ||
            e.skills?.some((s) => s.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.provider) {
        employees = employees.filter(
          (e) => e.provider.toLowerCase() === filters.provider?.toLowerCase()
        );
      }

      if (filters?.priceRange) {
        const { min, max } = filters.priceRange;
        if (min !== undefined) {
          employees = employees.filter((e) => e.price >= min);
        }
        if (max !== undefined) {
          employees = employees.filter((e) => e.price <= max);
        }
      }

      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            employees.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'price':
            employees.sort((a, b) => a.price - b.price);
            break;
          case 'rating':
            employees.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'popular':
            employees.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
            break;
        }
      }

      return employees;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    gcTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to load marketplace employees',
    },
  });
}

/**
 * Fetch a single employee by ID with purchase status
 *
 * @param employeeId - The employee ID to fetch
 * @returns UseQueryResult with EmployeeDetailData or null
 */
export function useEmployeeDetail(
  employeeId: string | undefined
): UseQueryResult<EmployeeDetailData | null, Error> {
  return useQuery<EmployeeDetailData | null, Error>({
    queryKey: queryKeys.employees.detail(employeeId ?? ''),
    queryFn: async (): Promise<EmployeeDetailData | null> => {
      if (!employeeId) return null;

      const employee = getEmployeeById(employeeId);
      if (!employee) return null;

      const user = await getCurrentUser();
      let isPurchased = false;
      let purchaseRecord: PurchasedEmployeeRecord | undefined;

      if (user) {
        isPurchased = await isEmployeePurchased(user.id, employeeId);

        if (isPurchased) {
          const records = await listPurchasedEmployees(user.id);
          purchaseRecord = records.find((r) => r.employee_id === employeeId);
        }
      }

      return {
        employee,
        isPurchased,
        purchaseRecord,
      };
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load employee details',
    },
  });
}

/**
 * Fetch all purchased/hired employees for the current user
 *
 * @param userId - The user ID
 * @returns UseQueryResult with array of PurchasedEmployeeRecord
 */
export function useHiredEmployees(
  userId: string | undefined
): UseQueryResult<PurchasedEmployeeRecord[], Error> {
  return useQuery<PurchasedEmployeeRecord[], Error>({
    queryKey: queryKeys.workforce.hired(userId ?? ''),
    queryFn: async (): Promise<PurchasedEmployeeRecord[]> => {
      if (!userId) return [];
      return listPurchasedEmployees(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load hired employees',
    },
  });
}

/**
 * Fetch purchased employees for a user
 *
 * @param userId - The user ID
 * @returns UseQueryResult with array of PurchasedEmployeeRecord
 */
export function usePurchasedEmployees(
  userId: string | undefined
): UseQueryResult<PurchasedEmployeeRecord[], Error> {
  return useQuery<PurchasedEmployeeRecord[], Error>({
    queryKey: queryKeys.employees.purchased(userId ?? ''),
    queryFn: async (): Promise<PurchasedEmployeeRecord[]> => {
      if (!userId) return [];
      return listPurchasedEmployees(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load purchased employees',
    },
  });
}

/**
 * Fetch employee categories
 *
 * @returns UseQueryResult with array of category strings
 */
export function useEmployeeCategories(): UseQueryResult<string[], Error> {
  return useQuery<string[], Error>({
    queryKey: queryKeys.employees.categories(),
    queryFn: async (): Promise<string[]> => {
      const categories = new Set<string>();
      AI_EMPLOYEES.forEach((e) => categories.add(e.category));
      return Array.from(categories).sort();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    meta: {
      errorMessage: 'Failed to load employee categories',
    },
  });
}

/**
 * Fetch employee reviews
 *
 * @param employeeId - The employee ID to fetch reviews for
 * @returns UseQueryResult with array of EmployeeReview
 */
export function useEmployeeReviews(
  employeeId: string | undefined
): UseQueryResult<EmployeeReview[], Error> {
  return useQuery<EmployeeReview[], Error>({
    queryKey: queryKeys.employees.reviews(employeeId ?? ''),
    queryFn: async (): Promise<EmployeeReview[]> => {
      if (!employeeId) return [];

      // Try to fetch from database
      const { data, error } = await supabase
        .from('employee_reviews')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useEmployeeReviews] Reviews table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        employeeId: r.employee_id,
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.created_at,
        userName: r.user_name,
        userAvatar: r.user_avatar,
      }));
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load employee reviews',
    },
  });
}

/**
 * Fetch workforce statistics for a user
 *
 * @param userId - The user ID
 * @returns UseQueryResult with WorkforceStats
 */
export function useWorkforceStats(
  userId: string | undefined
): UseQueryResult<WorkforceStats, Error> {
  return useQuery<WorkforceStats, Error>({
    queryKey: queryKeys.workforce.stats(),
    queryFn: async (): Promise<WorkforceStats> => {
      if (!userId) {
        return {
          totalHired: 0,
          activeEmployees: 0,
          totalTasksCompleted: 0,
          averageRating: 0,
          totalTokensUsed: 0,
        };
      }

      // Fetch hired employees count
      const employees = await listPurchasedEmployees(userId);
      const activeEmployees = employees.filter((e) => e.is_active).length;

      // Fetch token usage
      const { data: tokenData } = await supabase
        .from('user_token_balances')
        .select('current_balance')
        .eq('user_id', userId)
        .maybeSingle();

      const totalTokensUsed = tokenData ? 1000000 - (tokenData.current_balance || 0) : 0;

      return {
        totalHired: employees.length,
        activeEmployees,
        totalTasksCompleted: 0, // TODO: Implement task tracking
        averageRating: 4.5, // Placeholder
        totalTokensUsed: Math.max(0, totalTokensUsed),
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load workforce statistics',
    },
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hire/purchase an employee
 *
 * @returns UseMutationResult for purchasing an employee
 */
export function useHireEmployee(): UseMutationResult<
  PurchasedEmployeeRecord,
  Error,
  AIEmployee
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<PurchasedEmployeeRecord, Error, AIEmployee>({
    mutationFn: async (employee: AIEmployee): Promise<PurchasedEmployeeRecord> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to hire an employee');
      }

      return purchaseEmployee(user.id, employee);
    },
    onSuccess: async (record: PurchasedEmployeeRecord): Promise<void> => {
      const user = await getCurrentUser();
      if (user) {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.workforce.hired(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.employees.purchased(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.employees.detail(record.employee_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.workforce.stats(),
        });
      }
      toast.success(`${record.name} has been hired successfully!`);
    },
    onError: (error: Error): void => {
      logger.error('Failed to hire employee:', error);
      toast.error(error.message || 'Failed to hire employee');
    },
  });
}

/**
 * Toggle employee active status
 *
 * @returns UseMutationResult for toggling employee status
 */
export function useToggleEmployeeStatus(): UseMutationResult<
  { employeeId: string; isActive: boolean },
  Error,
  { employeeId: string; isActive: boolean }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    { employeeId: string; isActive: boolean },
    Error,
    { employeeId: string; isActive: boolean }
  >({
    mutationFn: async ({
      employeeId,
      isActive,
    }: {
      employeeId: string;
      isActive: boolean;
    }): Promise<{ employeeId: string; isActive: boolean }> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in');
      }

      const { error } = await supabase
        .from('purchased_employees')
        .update({ is_active: isActive })
        .eq('user_id', user.id)
        .eq('employee_id', employeeId);

      if (error) {
        throw error;
      }

      return { employeeId, isActive };
    },
    onSuccess: async ({ isActive }): Promise<void> => {
      const user = await getCurrentUser();
      if (user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workforce.hired(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.workforce.stats(),
        });
      }
      toast.success(`Employee ${isActive ? 'activated' : 'deactivated'}`);
    },
    onError: (error: Error): void => {
      logger.error('Failed to toggle employee status:', error);
      toast.error('Failed to update employee status');
    },
  });
}

/**
 * Submit an employee review
 *
 * @returns UseMutationResult for submitting a review
 */
export function useSubmitEmployeeReview(): UseMutationResult<
  EmployeeReview,
  Error,
  { employeeId: string; rating: number; comment: string }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    EmployeeReview,
    Error,
    { employeeId: string; rating: number; comment: string }
  >({
    mutationFn: async ({
      employeeId,
      rating,
      comment,
    }: {
      employeeId: string;
      rating: number;
      comment: string;
    }): Promise<EmployeeReview> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to submit a review');
      }

      const { data, error } = await supabase
        .from('employee_reviews')
        .insert({
          user_id: user.id,
          employee_id: employeeId,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        employeeId: data.employee_id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.created_at,
      };
    },
    onSuccess: (review: EmployeeReview): void => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.reviews(review.employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(review.employeeId),
      });
      toast.success('Review submitted successfully');
    },
    onError: (error: Error): void => {
      logger.error('Failed to submit review:', error);
      toast.error(error.message || 'Failed to submit review');
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Invalidate all workforce queries
 *
 * @returns Callback function to invalidate workforce queries
 */
export function useInvalidateWorkforceQueries(): () => void {
  const queryClient: QueryClient = useQueryClient();

  return (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workforce.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all() });
  };
}

/**
 * Check if a specific employee is hired
 *
 * @param employeeId - The employee ID to check
 * @returns UseQueryResult with boolean
 */
export function useIsEmployeeHired(
  employeeId: string | undefined
): UseQueryResult<boolean, Error> {
  return useQuery<boolean, Error>({
    queryKey: ['employees', 'isHired', employeeId],
    queryFn: async (): Promise<boolean> => {
      if (!employeeId) return false;

      const user = await getCurrentUser();
      if (!user) return false;

      return isEmployeePurchased(user.id, employeeId);
    },
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
