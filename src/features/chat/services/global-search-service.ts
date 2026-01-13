/**
 * Global Search Service
 * Searches across all chat sessions and messages with advanced filtering
 */

import { supabase } from '@shared/lib/supabase-client';
import type { ChatSession, ChatMessage } from '../types';

export interface SearchResult {
  type: 'session' | 'message';
  sessionId: string;
  sessionTitle: string;
  messageId?: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
  createdAt: Date;
  updatedAt: Date;
  matchedText: string; // The text that matched the search
  contextBefore?: string; // Text before the match for context
  contextAfter?: string; // Text after the match for context
}

export interface SearchFilters {
  query: string;
  sessionIds?: string[]; // Filter by specific sessions
  startDate?: Date; // Filter messages after this date
  endDate?: Date; // Filter messages before this date
  role?: 'user' | 'assistant' | 'system'; // Filter by message role
  includeArchived?: boolean; // Include archived sessions
  limit?: number; // Max results (default: 50)
}

export interface SearchStats {
  totalResults: number;
  sessionMatches: number;
  messageMatches: number;
  searchTime: number; // in milliseconds
}

interface MessageWithSession {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
  chat_sessions: {
    id: string;
    title: string | null;
  } | null;
}

class GlobalSearchService {
  private readonly CONTEXT_LENGTH = 50; // Characters of context before/after match
  private readonly DEFAULT_LIMIT = 50;

  /**
   * Search across all chat sessions and messages
   */
  async search(
    userId: string,
    filters: SearchFilters
  ): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now();
    const limit = filters.limit || this.DEFAULT_LIMIT;

    try {
      // Search in parallel for better performance
      const [sessionResults, messageResults] = await Promise.all([
        this.searchSessions(userId, filters),
        this.searchMessages(userId, filters),
      ]);

      // Combine and sort by relevance (most recent first)
      const allResults = [...sessionResults, ...messageResults].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      // Apply limit
      const limitedResults = allResults.slice(0, limit);

      const stats: SearchStats = {
        totalResults: allResults.length,
        sessionMatches: sessionResults.length,
        messageMatches: messageResults.length,
        searchTime: Date.now() - startTime,
      };

      return { results: limitedResults, stats };
    } catch (error) {
      console.error('[GlobalSearch] Search failed:', error);
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search in session titles
   */
  private async searchSessions(
    userId: string,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    if (!filters.query.trim()) return [];

    let query = supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at, is_archived')
      .eq('user_id', userId)
      .ilike('title', `%${filters.query}%`);

    // Apply filters
    if (!filters.includeArchived) {
      query = query.eq('is_active', true);
    }

    if (filters.sessionIds && filters.sessionIds.length > 0) {
      query = query.in('id', filters.sessionIds);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query.order('updated_at', {
      ascending: false,
    });

    if (error) {
      console.error('[GlobalSearch] Session search failed:', error);
      return [];
    }

    return (data || []).map((session) => ({
      type: 'session' as const,
      sessionId: session.id,
      sessionTitle: session.title || 'Untitled Chat',
      content: session.title || '',
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
      matchedText: this.extractMatch(
        session.title || '',
        filters.query
      ).matched,
      contextBefore: this.extractMatch(
        session.title || '',
        filters.query
      ).before,
      contextAfter: this.extractMatch(
        session.title || '',
        filters.query
      ).after,
    }));
  }

  /**
   * Search in message content
   */
  private async searchMessages(
    userId: string,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    if (!filters.query.trim()) return [];

    // First, get user's session IDs to filter messages
    let sessionQuery = supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId);

    if (!filters.includeArchived) {
      sessionQuery = sessionQuery.eq('is_active', true);
    }

    if (filters.sessionIds && filters.sessionIds.length > 0) {
      sessionQuery = sessionQuery.in('id', filters.sessionIds);
    }

    const { data: sessions, error: sessionError } = await sessionQuery;

    if (sessionError) {
      console.error('[GlobalSearch] Failed to get user sessions:', sessionError);
      return [];
    }

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);

    // Search messages
    let messageQuery = supabase
      .from('chat_messages')
      .select(
        `
        id,
        session_id,
        role,
        content,
        created_at,
        updated_at,
        chat_sessions!inner (
          id,
          title
        )
      `
      )
      .in('session_id', sessionIds)
      .ilike('content', `%${filters.query}%`);

    // Apply role filter
    if (filters.role) {
      messageQuery = messageQuery.eq('role', filters.role);
    }

    // Apply date filters
    if (filters.startDate) {
      messageQuery = messageQuery.gte(
        'created_at',
        filters.startDate.toISOString()
      );
    }

    if (filters.endDate) {
      messageQuery = messageQuery.lte(
        'created_at',
        filters.endDate.toISOString()
      );
    }

    const { data, error } = await messageQuery
      .order('created_at', { ascending: false })
      .limit(100); // Limit raw query results to prevent overload

    if (error) {
      console.error('[GlobalSearch] Message search failed:', error);
      return [];
    }

    return ((data || []) as MessageWithSession[]).map((message) => {
      const match = this.extractMatch(message.content, filters.query);

      return {
        type: 'message' as const,
        sessionId: message.session_id,
        sessionTitle: message.chat_sessions?.title || 'Untitled Chat',
        messageId: message.id,
        content: message.content,
        role: message.role as 'user' | 'assistant' | 'system',
        createdAt: new Date(message.created_at),
        updatedAt: new Date(message.updated_at),
        matchedText: match.matched,
        contextBefore: match.before,
        contextAfter: match.after,
      };
    });
  }

  /**
   * Extract matched text with surrounding context
   */
  private extractMatch(
    text: string,
    query: string
  ): { matched: string; before: string; after: string } {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return {
        matched: text.substring(0, this.CONTEXT_LENGTH),
        before: '',
        after: '',
      };
    }

    const matchEnd = matchIndex + query.length;
    const beforeStart = Math.max(0, matchIndex - this.CONTEXT_LENGTH);
    const afterEnd = Math.min(text.length, matchEnd + this.CONTEXT_LENGTH);

    return {
      matched: text.substring(matchIndex, matchEnd),
      before: text.substring(beforeStart, matchIndex),
      after: text.substring(matchEnd, afterEnd),
    };
  }

  /**
   * Get search suggestions based on recent searches (future enhancement)
   */
  async getSearchSuggestions(userId: string, partialQuery: string): Promise<string[]> {
    // TODO: Implement search history and suggestions
    // For now, return empty array
    return [];
  }

  /**
   * Search with autocomplete
   */
  async autocomplete(
    userId: string,
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    if (partialQuery.trim().length < 2) return [];

    try {
      // Get recent unique words/phrases from session titles
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('title')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${partialQuery}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return [...new Set(data.map((s) => s.title).filter(Boolean))].slice(
        0,
        limit
      );
    } catch (error) {
      console.error('[GlobalSearch] Autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Get popular search terms (future enhancement)
   */
  async getPopularSearches(userId: string, limit: number = 10): Promise<string[]> {
    // TODO: Track search analytics and return popular terms
    return [];
  }
}

export const globalSearchService = new GlobalSearchService();
