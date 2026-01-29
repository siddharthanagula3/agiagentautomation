/**
 * Search History React Query Hooks
 * Provides hooks for tracking and retrieving search history using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import {
  searchHistoryService,
  type RecentSearch,
  type PopularSearch,
  type SearchSuggestion,
  type SearchFilters,
} from '@core/storage/search-history-service';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch recent searches for the current user
 *
 * @param limit - Maximum number of results (default: 10)
 * @returns React Query result with recent searches
 *
 * @example
 * ```tsx
 * const { data: recentSearches, isLoading } = useRecentSearches(5);
 * ```
 */
export function useRecentSearches(limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.search.recent(''), limit],
    queryFn: async (): Promise<RecentSearch[]> => {
      const user = await getCurrentUser();
      if (!user) return [];

      return searchHistoryService.getRecentSearches(user.id, limit);
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load recent searches',
    },
  });
}

/**
 * Hook to fetch recent searches for a specific user
 *
 * @param userId - The user's ID
 * @param limit - Maximum number of results (default: 10)
 * @returns React Query result with recent searches
 */
export function useUserRecentSearches(
  userId: string | undefined,
  limit: number = 10
) {
  return useQuery({
    queryKey: queryKeys.search.recent(userId ?? ''),
    queryFn: async (): Promise<RecentSearch[]> => {
      if (!userId) return [];
      return searchHistoryService.getRecentSearches(userId, limit);
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load recent searches',
    },
  });
}

/**
 * Hook to fetch popular searches
 *
 * @param limit - Maximum number of results (default: 10)
 * @param days - Number of days to look back (default: 7)
 * @returns React Query result with popular searches
 *
 * @example
 * ```tsx
 * const { data: popularSearches } = usePopularSearches(10, 30);
 * ```
 */
export function usePopularSearches(limit: number = 10, days: number = 7) {
  return useQuery({
    queryKey: [...queryKeys.search.popular(), limit, days],
    queryFn: async (): Promise<PopularSearch[]> => {
      return searchHistoryService.getPopularSearches(limit, days);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - popular searches change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load popular searches',
    },
  });
}

/**
 * Hook to fetch search suggestions based on partial query
 * Combines user's recent searches with popular searches
 *
 * @param partialQuery - The partial query to match against
 * @param limit - Maximum number of results (default: 5)
 * @returns React Query result with suggestions
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const { data: suggestions } = useSearchSuggestions(query, 5);
 * ```
 */
export function useSearchSuggestions(
  partialQuery: string,
  limit: number = 5
) {
  return useQuery({
    queryKey: [...queryKeys.search.suggestions('', partialQuery), limit],
    queryFn: async (): Promise<SearchSuggestion[]> => {
      const user = await getCurrentUser();
      if (!user) return [];

      return searchHistoryService.getSearchSuggestions(
        user.id,
        partialQuery,
        limit
      );
    },
    enabled: partialQuery.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      errorMessage: 'Failed to load search suggestions',
    },
  });
}

/**
 * Hook to fetch search suggestions for a specific user
 *
 * @param userId - The user's ID
 * @param partialQuery - The partial query to match against
 * @param limit - Maximum number of results (default: 5)
 * @returns React Query result with suggestions
 */
export function useUserSearchSuggestions(
  userId: string | undefined,
  partialQuery: string,
  limit: number = 5
) {
  return useQuery({
    queryKey: queryKeys.search.suggestions(userId ?? '', partialQuery),
    queryFn: async (): Promise<SearchSuggestion[]> => {
      if (!userId) return [];
      return searchHistoryService.getSearchSuggestions(userId, partialQuery, limit);
    },
    enabled: !!userId && partialQuery.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      errorMessage: 'Failed to load search suggestions',
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to track a search query
 * Records the search and updates analytics
 *
 * @returns Mutation for tracking searches
 *
 * @example
 * ```tsx
 * const trackSearch = useTrackSearch();
 *
 * const handleSearch = async (query: string, results: Item[]) => {
 *   await trackSearch.mutateAsync({
 *     query,
 *     resultCount: results.length,
 *     filters: { category: 'agents' }
 *   });
 * };
 * ```
 */
export function useTrackSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      query,
      resultCount,
      filters,
    }: {
      query: string;
      resultCount: number;
      filters?: SearchFilters;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to track searches');
      }

      return searchHistoryService.trackSearch({
        userId: user.id,
        query,
        resultCount,
        filters,
      });
    },
    onSuccess: async () => {
      const user = await getCurrentUser();
      if (user) {
        // Invalidate recent searches to include the new one
        queryClient.invalidateQueries({
          queryKey: queryKeys.search.recent(user.id),
        });
        // Also invalidate the generic recent searches key
        queryClient.invalidateQueries({
          queryKey: queryKeys.search.recent(''),
        });
      }
      // Invalidate popular searches as they may have changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.search.popular(),
      });
    },
    onError: (error) => {
      logger.error('[useTrackSearch] Failed to track search:', error);
      // Don't show toast for tracking failures - they happen in the background
    },
  });
}

/**
 * Hook to clear all search history for the current user
 *
 * @returns Mutation for clearing history
 *
 * @example
 * ```tsx
 * const clearHistory = useClearSearchHistory();
 *
 * <button onClick={() => clearHistory.mutate()}>
 *   Clear History
 * </button>
 * ```
 */
export function useClearSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to clear search history');
      }

      return searchHistoryService.clearSearchHistory(user.id);
    },
    onSuccess: async (deletedCount) => {
      const user = await getCurrentUser();
      if (user) {
        // Clear cache
        queryClient.setQueryData(queryKeys.search.recent(user.id), []);
        queryClient.setQueryData(queryKeys.search.recent(''), []);
        // Invalidate to refetch empty state
        queryClient.invalidateQueries({
          queryKey: queryKeys.search.all(),
        });
      }
      toast.success(`Cleared ${deletedCount} search${deletedCount !== 1 ? 'es' : ''} from history`);
    },
    onError: (error) => {
      logger.error('[useClearSearchHistory] Failed to clear history:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear search history';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to delete a specific search from history
 *
 * @returns Mutation for deleting a search
 *
 * @example
 * ```tsx
 * const deleteSearch = useDeleteSearch();
 *
 * <button onClick={() => deleteSearch.mutate(searchId)}>
 *   Remove
 * </button>
 * ```
 */
export function useDeleteSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to delete a search');
      }

      await searchHistoryService.deleteSearch(user.id, searchId);
      return { searchId, userId: user.id };
    },
    onSuccess: async ({ userId }) => {
      // Invalidate recent searches to reflect deletion
      queryClient.invalidateQueries({
        queryKey: queryKeys.search.recent(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.search.recent(''),
      });
      toast.success('Search removed from history');
    },
    onError: (error) => {
      logger.error('[useDeleteSearch] Failed to delete search:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove search';
      toast.error(errorMessage);
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to invalidate all search-related queries
 * Useful after major changes or for force refresh
 *
 * @returns Function to invalidate search queries
 *
 * @example
 * ```tsx
 * const invalidateSearchQueries = useInvalidateSearchQueries();
 *
 * <button onClick={invalidateSearchQueries}>
 *   Refresh
 * </button>
 * ```
 */
export function useInvalidateSearchQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.search.all() });
  };
}

/**
 * Combined hook for search functionality
 * Provides all search-related state and actions in one hook
 *
 * @param options - Configuration options
 * @returns Object with search state and actions
 *
 * @example
 * ```tsx
 * const {
 *   recentSearches,
 *   popularSearches,
 *   trackSearch,
 *   clearHistory,
 *   isLoading
 * } = useSearchHistory({ recentLimit: 5 });
 * ```
 */
export function useSearchHistory(options?: {
  recentLimit?: number;
  popularLimit?: number;
  popularDays?: number;
}) {
  const {
    recentLimit = 10,
    popularLimit = 10,
    popularDays = 7,
  } = options || {};

  const recentSearchesQuery = useRecentSearches(recentLimit);
  const popularSearchesQuery = usePopularSearches(popularLimit, popularDays);
  const trackSearchMutation = useTrackSearch();
  const clearHistoryMutation = useClearSearchHistory();
  const deleteSearchMutation = useDeleteSearch();
  const invalidateQueries = useInvalidateSearchQueries();

  return {
    // Data
    recentSearches: recentSearchesQuery.data || [],
    popularSearches: popularSearchesQuery.data || [],

    // Loading states
    isLoadingRecent: recentSearchesQuery.isLoading,
    isLoadingPopular: popularSearchesQuery.isLoading,
    isLoading: recentSearchesQuery.isLoading || popularSearchesQuery.isLoading,

    // Error states
    recentError: recentSearchesQuery.error,
    popularError: popularSearchesQuery.error,

    // Refetch functions
    refetchRecent: recentSearchesQuery.refetch,
    refetchPopular: popularSearchesQuery.refetch,

    // Mutations
    trackSearch: trackSearchMutation.mutate,
    trackSearchAsync: trackSearchMutation.mutateAsync,
    isTracking: trackSearchMutation.isPending,

    clearHistory: clearHistoryMutation.mutate,
    clearHistoryAsync: clearHistoryMutation.mutateAsync,
    isClearing: clearHistoryMutation.isPending,

    deleteSearch: deleteSearchMutation.mutate,
    deleteSearchAsync: deleteSearchMutation.mutateAsync,
    isDeleting: deleteSearchMutation.isPending,

    // Utilities
    invalidateQueries,
  };
}

// Re-export types for convenience
export type {
  TrackSearchParams,
  RecentSearch,
  PopularSearch,
  SearchSuggestion,
  SearchFilters,
} from '@core/storage/search-history-service';
