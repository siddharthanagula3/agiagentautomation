/**
 * Enhanced Cache Service with Multi-Level Caching
 * Supports memory, localStorage, IndexedDB with automatic fallback
 */

// ========================================
// Types and Interfaces
// ========================================

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  compressed?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  compress?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  size: number;
}

// ========================================
// Storage Backends
// ========================================

interface StorageBackend {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Memory Storage
class MemoryStorage implements StorageBackend {
  private data = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    return (this.data.get(key) as CacheEntry<T>) || null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.data.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}

// LocalStorage Backend
class LocalStorageBackend implements StorageBackend {
  private prefix = 'cache:';

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// IndexedDB Backend
class IndexedDBBackend implements StorageBackend {
  private dbName = 'CacheDB';
  private storeName = 'cache';
  private version = 1;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(entry, key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB cache set failed:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB cache clear failed:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();
        
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// ========================================
// Enhanced Cache Manager
// ========================================

export class EnhancedCache {
  private memory: MemoryStorage;
  private localStorage: LocalStorageBackend;
  private indexedDB: IndexedDBBackend;
  
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  private defaultTTL = 60 * 60 * 1000; // 1 hour
  private maxMemorySize = 100; // Max items in memory cache

  constructor() {
    this.memory = new MemoryStorage();
    this.localStorage = new LocalStorageBackend();
    this.indexedDB = new IndexedDBBackend();
  }

  // Get item from cache (checks all levels)
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      // Level 1: Memory cache (fastest)
      let entry = await this.memory.get<T>(key);
      
      if (entry && !this.isExpired(entry)) {
        this.stats.hits++;
        return entry.data;
      }

      // Level 2: LocalStorage
      entry = await this.localStorage.get<T>(key);
      
      if (entry && !this.isExpired(entry)) {
        // Promote to memory cache
        await this.memory.set(key, entry);
        this.stats.hits++;
        return entry.data;
      }

      // Level 3: IndexedDB
      entry = await this.indexedDB.get<T>(key);
      
      if (entry && !this.isExpired(entry)) {
        // Promote to memory and localStorage
        await this.memory.set(key, entry);
        await this.localStorage.set(key, entry);
        this.stats.hits++;
        return entry.data;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Set item in cache (stores in all levels)
  async set<T = unknown>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl: options.ttl || this.defaultTTL,
        tags: options.tags || [],
        metadata: options.metadata || {},
        compressed: options.compress || false,
      };

      // Store in all levels
      await Promise.all([
        this.memory.set(key, entry),
        this.localStorage.set(key, entry),
        this.indexedDB.set(key, entry),
      ]);

      this.stats.sets++;

      // Cleanup if memory cache is too large
      const memorySize = await this.memory.size();
      if (memorySize > this.maxMemorySize) {
        await this.cleanupMemory();
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete item from cache
  async delete(key: string): Promise<boolean> {
    try {
      await Promise.all([
        this.memory.delete(key),
        this.localStorage.delete(key),
        this.indexedDB.delete(key),
      ]);
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    await Promise.all([
      this.memory.clear(),
      this.localStorage.clear(),
      this.indexedDB.clear(),
    ]);
    this.resetStats();
  }

  // Delete by tag
  async deleteByTag(tag: string): Promise<number> {
    let deleted = 0;
    const keys = await this.getAllKeys();
    
    for (const key of keys) {
      const entry = await this.memory.get(key) || 
                     await this.localStorage.get(key) || 
                     await this.indexedDB.get(key);
      
      if (entry?.tags?.includes(tag)) {
        await this.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  // Get cache statistics
  getStats(): CacheStats {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      size: 0, // Will be updated async
    };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Cleanup old entries from memory
  private async cleanupMemory(): Promise<void> {
    const keys = await this.memory.keys();
    const entries: Array<{ key: string; timestamp: number }> = [];

    for (const key of keys) {
      const entry = await this.memory.get(key);
      if (entry) {
        if (this.isExpired(entry)) {
          await this.memory.delete(key);
        } else {
          entries.push({ key, timestamp: entry.timestamp });
        }
      }
    }

    // Remove oldest entries if still over limit
    if (entries.length > this.maxMemorySize) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - this.maxMemorySize);
      for (const { key } of toRemove) {
        await this.memory.delete(key);
      }
    }
  }

  // Get all cache keys
  private async getAllKeys(): Promise<string[]> {
    const [memKeys, lsKeys, idbKeys] = await Promise.all([
      this.memory.keys(),
      this.localStorage.keys(),
      this.indexedDB.keys(),
    ]);
    return [...new Set([...memKeys, ...lsKeys, ...idbKeys])];
  }
}

// ========================================
// Singleton Instance
// ========================================

export const enhancedCache = new EnhancedCache();

// ========================================
// React Hook for Caching
// ========================================

import { useCallback, useEffect, useState } from 'react';

export interface UseCacheOptions {
  ttl?: number;
  tags?: string[];
  enabled?: boolean;
  refetchInterval?: number;
}

export const useCache = <T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) => {
  const {
    ttl,
    tags,
    enabled = true,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Try cache first
      if (!forceRefresh) {
        const cached = await enhancedCache.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();

      // Cache the result
      await enhancedCache.set(key, freshData, { ttl, tags });

      setData(freshData);
      setLoading(false);
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [key, fetcher, enabled, ttl, tags]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
