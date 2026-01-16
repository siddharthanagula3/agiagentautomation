/**
 * Comprehensive Caching Service
 * Implements multi-layer caching with in-memory and persistent storage
 */

import { supabase } from '@shared/lib/supabase-client';

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
  accessCount: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  persistent?: boolean; // Store in Supabase
  refreshOnAccess?: boolean; // Update TTL on access
}

interface PersistentCacheRow {
  cache_key: string;
  cache_value: unknown;
  expires_at: string;
  accessed_count: number;
  last_accessed_at: string;
  created_at: string;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  // Updated: Jan 15th 2026 - Fixed NodeJS.Timeout type mismatch for browser compatibility
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (new Date() < memoryEntry.expiresAt) {
        memoryEntry.accessCount++;
        return memoryEntry.value as T;
      } else {
        // Expired - remove from memory
        this.memoryCache.delete(key);
      }
    }

    // Try persistent cache
    try {
      const { data, error } = await supabase
        .from('cache_entries')
        .select('*')
        .eq('cache_key', key)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const entry = data as PersistentCacheRow;
      const expiresAt = new Date(entry.expires_at);

      if (new Date() < expiresAt) {
        // Cache hit - update access count
        await supabase
          .from('cache_entries')
          .update({
            accessed_count: entry.accessed_count + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('cache_key', key);

        // Store in memory for faster access
        this.memoryCache.set(key, {
          key,
          value: entry.cache_value,
          expiresAt,
          createdAt: new Date(entry.created_at),
          accessCount: entry.accessed_count + 1,
        });

        return entry.cache_value as T;
      } else {
        // Expired - remove from persistent cache
        await this.delete(key);
        return null;
      }
    } catch (error) {
      console.error('[Cache] Error getting from persistent cache:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = unknown>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = this.DEFAULT_TTL,
      persistent = false,
      refreshOnAccess = false,
    } = options;

    const expiresAt = new Date(Date.now() + ttl);
    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt,
      createdAt: new Date(),
      accessCount: 0,
    };

    // Always store in memory
    this.memoryCache.set(key, entry);

    // Optionally store in persistent cache
    if (persistent) {
      try {
        await supabase.from('cache_entries').upsert({
          cache_key: key,
          cache_value: value,
          expires_at: expiresAt.toISOString(),
          accessed_count: 0,
          last_accessed_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Cache] Error setting persistent cache:', error);
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    // Remove from memory
    this.memoryCache.delete(key);

    // Remove from persistent cache
    try {
      await supabase.from('cache_entries').delete().eq('cache_key', key);
    } catch (error) {
      console.error('[Cache] Error deleting from persistent cache:', error);
    }
  }

  /**
   * Clear all cache (or by pattern)
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      // Clear all memory cache
      this.memoryCache.clear();

      // Clear all persistent cache
      try {
        await supabase
          .from('cache_entries')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000');
      } catch (error) {
        console.error('[Cache] Error clearing persistent cache:', error);
      }
    } else {
      // Clear by pattern (e.g., "user:*" or "*:stats")
      const keysToDelete: string[] = [];

      // Check memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }

      // Delete from memory
      keysToDelete.forEach((key) => this.memoryCache.delete(key));

      // Delete from persistent cache (using SQL LIKE)
      try {
        const likePattern = pattern.replace(/\*/g, '%');
        await supabase
          .from('cache_entries')
          .delete()
          .like('cache_key', likePattern);
      } catch (error) {
        console.error(
          '[Cache] Error clearing persistent cache by pattern:',
          error
        );
      }
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const memorySize = this.memoryCache.size;
    const entries = Array.from(this.memoryCache.values());

    const stats = {
      memorySize,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAccessCount:
        memorySize > 0
          ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) /
            memorySize
          : 0,
      expiredCount: entries.filter((entry) => new Date() >= entry.expiresAt)
        .length,
    };

    return stats;
  }

  /**
   * Wrap a function with caching
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options: {
      keyGenerator: (...args: Parameters<T>) => string;
      ttl?: number;
      persistent?: boolean;
    }
  ): T {
    const { keyGenerator, ttl, persistent } = options;

    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);

      // Check cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn(...args);

      // Cache result
      await this.set(key, result, { ttl, persistent });

      return result;
    }) as T;
  }

  /**
   * Batch get multiple keys
   */
  async getMany<T = unknown>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    // Try to get from memory first
    const missingKeys: string[] = [];
    for (const key of keys) {
      const value = this.memoryCache.get(key);
      if (value && new Date() < value.expiresAt) {
        results.set(key, value.value as T);
      } else {
        missingKeys.push(key);
      }
    }

    // Fetch missing keys from persistent cache
    if (missingKeys.length > 0) {
      try {
        const { data, error } = await supabase
          .from('cache_entries')
          .select('*')
          .in('cache_key', missingKeys);

        if (!error && data) {
          for (const entry of data as PersistentCacheRow[]) {
            const expiresAt = new Date(entry.expires_at);
            if (new Date() < expiresAt) {
              results.set(entry.cache_key, entry.cache_value as T);

              // Store in memory
              this.memoryCache.set(entry.cache_key, {
                key: entry.cache_key,
                value: entry.cache_value,
                expiresAt,
                createdAt: new Date(entry.created_at),
                accessCount: entry.accessed_count,
              });
            }
          }
        }
      } catch (error) {
        console.error('[Cache] Error in batch get:', error);
      }
    }

    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async setMany<T = unknown>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = this.DEFAULT_TTL, persistent = false } = options;

    const expiresAt = new Date(Date.now() + ttl);

    // Set in memory
    for (const { key, value } of entries) {
      this.memoryCache.set(key, {
        key,
        value,
        expiresAt,
        createdAt: new Date(),
        accessCount: 0,
      });
    }

    // Set in persistent cache if needed
    if (persistent) {
      try {
        const rows = entries.map(({ key, value }) => ({
          cache_key: key,
          cache_value: value,
          expires_at: expiresAt.toISOString(),
          accessed_count: 0,
          last_accessed_at: new Date().toISOString(),
        }));

        await supabase.from('cache_entries').upsert(rows);
      } catch (error) {
        console.error('[Cache] Error in batch set:', error);
      }
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // For each tag, clear cache entries that match
    for (const tag of tags) {
      await this.clear(`*:${tag}:*`);
    }
  }

  // Private methods

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    // Delete expired entries
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  private matchPattern(str: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' +
        pattern
          .split('*')
          .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('.*') +
        '$'
    );
    return regex.test(str);
  }

  /**
   * Stop cleanup timer (for cleanup)
   */
  // Updated: Jan 15th 2026 - Fixed memory leak by clearing memory cache on destroy
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    // Clear memory cache to prevent memory leaks
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export utility functions for common cache patterns

/**
 * Cache key generators
 */
export const CacheKeys = {
  dashboardStats: (userId: string) => `dashboard:stats:${userId}`,
  userEmployees: (userId: string) => `user:employees:${userId}`,
  chatMessages: (sessionId: string) => `chat:messages:${sessionId}`,
  workflowStats: (workflowId: string) => `workflow:stats:${workflowId}`,
  analyticsMetrics: (userId: string, period: string) =>
    `analytics:metrics:${userId}:${period}`,
  automationOverview: (userId: string) => `automation:overview:${userId}`,
  userSettings: (userId: string) => `user:settings:${userId}`,
  apiUsage: (userId: string, period: string) => `api:usage:${userId}:${period}`,
};

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};
