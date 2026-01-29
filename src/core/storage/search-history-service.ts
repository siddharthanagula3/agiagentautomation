/**
 * Search History Service
 * Wraps Supabase RPC functions for tracking and retrieving search history
 * Integrates with search_history and search_analytics tables
 */

import { supabase } from '@shared/lib/supabase-client';
import { logger } from '@shared/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Filters applied to a search query
 */
export interface SearchFilters {
  category?: string;
  provider?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Parameters for tracking a new search
 */
export interface TrackSearchParams {
  userId: string;
  query: string;
  resultCount: number;
  filters?: SearchFilters;
}

/**
 * A recent search entry from the user's history
 */
export interface RecentSearch {
  query: string;
  resultCount: number;
  createdAt: Date;
}

/**
 * A popular search entry from analytics
 */
export interface PopularSearch {
  query: string;
  searchCount: number;
  avgResults: number;
}

/**
 * A search suggestion with source information
 */
export interface SearchSuggestion {
  suggestion: string;
  source: 'recent' | 'popular';
  score: number;
}

/**
 * Result from track_search RPC
 */
interface TrackSearchResult {
  data: string | null;
  error: { message: string; code?: string } | null;
}

/**
 * Row from get_recent_searches RPC
 */
interface RecentSearchRow {
  query: string;
  result_count: number;
  created_at: string;
}

/**
 * Row from get_popular_searches RPC
 */
interface PopularSearchRow {
  query: string;
  search_count: number;
  avg_results: number;
}

/**
 * Row from get_search_suggestions RPC
 */
interface SearchSuggestionRow {
  suggestion: string;
  source: string;
  score: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Search History Service
 * Provides methods for tracking and retrieving search history
 */
export class SearchHistoryService {
  private static instance: SearchHistoryService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SearchHistoryService {
    if (!SearchHistoryService.instance) {
      SearchHistoryService.instance = new SearchHistoryService();
    }
    return SearchHistoryService.instance;
  }

  /**
   * Track a search query
   * Records the search in history and updates analytics
   *
   * @param params - Search tracking parameters
   * @returns The ID of the created search history entry, or null if failed
   */
  async trackSearch(params: TrackSearchParams): Promise<string | null> {
    const { userId, query, resultCount, filters = {} } = params;

    // Skip empty queries
    if (!query.trim()) {
      logger.debug('[SearchHistory] Skipping empty query');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('track_search', {
        p_user_id: userId,
        p_query: query,
        p_result_count: resultCount,
        p_filters: filters,
      }) as TrackSearchResult;

      if (error) {
        logger.error('[SearchHistory] Failed to track search:', error);
        throw new Error(error.message);
      }

      logger.debug('[SearchHistory] Tracked search:', { query, resultCount });
      return data;
    } catch (error) {
      logger.error('[SearchHistory] Error tracking search:', error);
      throw error;
    }
  }

  /**
   * Get recent searches for a user
   * Returns deduplicated recent searches ordered by most recent
   *
   * @param userId - The user's ID
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of recent search entries
   */
  async getRecentSearches(
    userId: string,
    limit: number = 10
  ): Promise<RecentSearch[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_searches', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) {
        logger.error('[SearchHistory] Failed to get recent searches:', error);
        throw new Error(error.message);
      }

      const rows = (data || []) as RecentSearchRow[];

      return rows.map((row) => ({
        query: row.query,
        resultCount: row.result_count,
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      logger.error('[SearchHistory] Error getting recent searches:', error);
      throw error;
    }
  }

  /**
   * Get popular searches across all users
   * Returns searches ranked by frequency within the specified time window
   *
   * @param limit - Maximum number of results (default: 10)
   * @param days - Number of days to look back (default: 7)
   * @returns Array of popular search entries
   */
  async getPopularSearches(
    limit: number = 10,
    days: number = 7
  ): Promise<PopularSearch[]> {
    try {
      const { data, error } = await supabase.rpc('get_popular_searches', {
        p_limit: limit,
        p_days: days,
      });

      if (error) {
        logger.error('[SearchHistory] Failed to get popular searches:', error);
        throw new Error(error.message);
      }

      const rows = (data || []) as PopularSearchRow[];

      return rows.map((row) => ({
        query: row.query,
        searchCount: row.search_count,
        avgResults: Number(row.avg_results) || 0,
      }));
    } catch (error) {
      logger.error('[SearchHistory] Error getting popular searches:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   * Combines user's recent searches with popular searches
   *
   * @param userId - The user's ID
   * @param partialQuery - The partial query to match against
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of search suggestions
   */
  async getSearchSuggestions(
    userId: string,
    partialQuery: string,
    limit: number = 5
  ): Promise<SearchSuggestion[]> {
    // Skip if query is too short
    if (partialQuery.trim().length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_search_suggestions', {
        p_user_id: userId,
        p_partial_query: partialQuery,
        p_limit: limit,
      });

      if (error) {
        logger.error('[SearchHistory] Failed to get suggestions:', error);
        throw new Error(error.message);
      }

      const rows = (data || []) as SearchSuggestionRow[];

      return rows.map((row) => ({
        suggestion: row.suggestion,
        source: row.source as 'recent' | 'popular',
        score: row.score,
      }));
    } catch (error) {
      logger.error('[SearchHistory] Error getting suggestions:', error);
      throw error;
    }
  }

  /**
   * Clear all search history for a user
   *
   * @param userId - The user's ID
   * @returns Number of deleted entries
   */
  async clearSearchHistory(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('clear_search_history', {
        p_user_id: userId,
      });

      if (error) {
        logger.error('[SearchHistory] Failed to clear history:', error);
        throw new Error(error.message);
      }

      const deletedCount = data as number;
      logger.info('[SearchHistory] Cleared history:', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('[SearchHistory] Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Delete a specific search from history
   * Note: This uses direct table access, not an RPC function
   *
   * @param userId - The user's ID
   * @param searchId - The search entry ID to delete
   */
  async deleteSearch(userId: string, searchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId);

      if (error) {
        logger.error('[SearchHistory] Failed to delete search:', error);
        throw new Error(error.message);
      }

      logger.debug('[SearchHistory] Deleted search:', { searchId });
    } catch (error) {
      logger.error('[SearchHistory] Error deleting search:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const searchHistoryService = SearchHistoryService.getInstance();

// Export default for convenience
export default searchHistoryService;
