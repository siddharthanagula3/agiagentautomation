/**
 * Advanced caching system with multiple storage backends and strategies
 * Supports memory, localStorage, IndexedDB, and cache expiration
 */

// ========================================
// Types and Interfaces
// ========================================

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  serialize?: boolean;
  compress?: boolean;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  storageBackend: 'memory' | 'localStorage' | 'indexedDB';
  enableCompression: boolean;
  enableSerialization: boolean;
}

export type CacheStorageBackend = 'memory' | 'localStorage' | 'indexedDB';

// ========================================
// Storage Backends
// ========================================

export interface CacheStorage {
  get<T = unknown>(key: string): Promise<CacheEntry<T> | null>;
  set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Memory Storage Backend
class MemoryStorage implements CacheStorage {
  private data = new Map<string, CacheEntry>();

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
    return (this.data.get(key) as CacheEntry<T>) || null;
  }

  async set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void> {
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
class LocalStorageBackend implements CacheStorage {
  private prefix = 'cache:';

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  async set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (error) {
      console.error('LocalStorage set error:', error);
      // Handle quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        // Clear some old entries and retry
        await this.cleanup();
        try {
          localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
        } catch (retryError) {
          console.error('LocalStorage retry failed:', retryError);
        }
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const storageKey = this.getStorageKey(key);
      const existed = localStorage.getItem(storageKey) !== null;
      localStorage.removeItem(storageKey);
      return existed;
    } catch (error) {
      console.error('LocalStorage delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.error('LocalStorage keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  async cleanup(): Promise<void> {
    const keys = await this.keys();
    const now = Date.now();

    for (const key of keys) {
      const entry = await this.get(key);
      if (entry?.ttl && now > entry.timestamp + entry.ttl) {
        await this.delete(key);
      }
    }
  }
}

// IndexedDB Backend
class IndexedDBBackend implements CacheStorage {
  private dbName = 'AGI_Cache';
  private storeName = 'cache_entries';
  private version = 1;
  private db: IDBDatabase | null = null;

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'key',
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('tags', 'tags', {
            unique: false,
            multiEntry: true,
          });
        }
      };

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(new Error(`IndexedDB error: ${request.error}`));
      };
    });
  }

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise(resolve => {
        const getRequest = store.get(key);
        getRequest.onsuccess = () => {
          const existed = !!getRequest.result;
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => resolve(existed);
          deleteRequest.onerror = () => resolve(false);
        };
        getRequest.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB size error:', error);
      return 0;
    }
  }
}

// ========================================
// Cache Implementation
// ========================================

export class Cache {
  private storage: CacheStorage;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      storageBackend: 'memory',
      enableCompression: false,
      enableSerialization: true,
      ...config,
    };

    this.storage = this.createStorage(this.config.storageBackend);
    this.startCleanup();
  }

  private createStorage(backend: CacheStorageBackend): CacheStorage {
    switch (backend) {
      case 'localStorage':
        return new LocalStorageBackend();
      case 'indexedDB':
        return new IndexedDBBackend();
      case 'memory':
      default:
        return new MemoryStorage();
    }
  }

  // Get item from cache
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const entry = await this.storage.get<T>(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if entry has expired
      if (this.isExpired(entry)) {
        await this.storage.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Set item in cache
  async set<T = unknown>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTTL,
        tags: options.tags || [],
        metadata: options.metadata || {},
      };

      // Check cache size limit
      const currentSize = await this.storage.size();
      if (currentSize >= this.config.maxSize) {
        await this.evictOldest();
      }

      await this.storage.set(key, entry);
      this.stats.sets++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete item from cache
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.storage.delete(key);
      if (result) {
        this.stats.deletes++;
      }
      return result;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache entries
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      this.resetStats();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get multiple items
  async getMany<T = unknown>(
    keys: string[]
  ): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    await Promise.all(
      keys.map(async key => {
        results[key] = await this.get<T>(key);
      })
    );

    return results;
  }

  // Set multiple items
  async setMany<T = unknown>(
    items: Record<string, T>,
    options: CacheOptions = {}
  ): Promise<void> {
    await Promise.all(
      Object.entries(items).map(([key, data]) => this.set(key, data, options))
    );
  }

  // Delete items by tag
  async deleteByTag(tag: string): Promise<number> {
    try {
      const keys = await this.storage.keys();
      let deleted = 0;

      for (const key of keys) {
        const entry = await this.storage.get(key);
        if (entry?.tags?.includes(tag)) {
          if (await this.storage.delete(key)) {
            deleted++;
          }
        }
      }

      this.stats.deletes += deleted;
      return deleted;
    } catch (error) {
      console.error('Cache deleteByTag error:', error);
      return 0;
    }
  }

  // Get items by tag
  async getByTag<T = unknown>(tag: string): Promise<Record<string, T>> {
    try {
      const keys = await this.storage.keys();
      const results: Record<string, T> = {};

      for (const key of keys) {
        const entry = await this.storage.get<T>(key);
        if (entry?.tags?.includes(tag) && !this.isExpired(entry)) {
          results[key] = entry.data;
        }
      }

      return results;
    } catch (error) {
      console.error('Cache getByTag error:', error);
      return {};
    }
  }

  // Check if item exists and is not expired
  async has(key: string): Promise<boolean> {
    try {
      const entry = await this.storage.get(key);
      return entry !== null && !this.isExpired(entry);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  // Get cache statistics
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
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

  // Get cache info
  async getInfo() {
    const size = await this.storage.size();
    const keys = await this.storage.keys();

    return {
      size,
      maxSize: this.config.maxSize,
      keys: keys.length,
      backend: this.config.storageBackend,
      stats: this.getStats(),
    };
  }

  // Cleanup expired entries
  async cleanup(): Promise<number> {
    try {
      const keys = await this.storage.keys();
      let cleaned = 0;

      for (const key of keys) {
        const entry = await this.storage.get(key);
        if (entry && this.isExpired(entry)) {
          if (await this.storage.delete(key)) {
            cleaned++;
          }
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  // Update TTL of existing entry
  async touch(key: string, ttl?: number): Promise<boolean> {
    try {
      const entry = await this.storage.get(key);
      if (!entry || this.isExpired(entry)) {
        return false;
      }

      entry.timestamp = Date.now();
      entry.ttl = ttl || entry.ttl || this.config.defaultTTL;

      await this.storage.set(key, entry);
      return true;
    } catch (error) {
      console.error('Cache touch error:', error);
      return false;
    }
  }

  // Private helper methods
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private async evictOldest(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      let oldestKey = '';
      let oldestTimestamp = Date.now();

      for (const key of keys) {
        const entry = await this.storage.get(key);
        if (entry && entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        await this.storage.delete(oldestKey);
      }
    } catch (error) {
      console.error('Cache evictOldest error:', error);
    }
  }

  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Automatic cache cleanup error:', error);
      });
    }, this.config.cleanupInterval);
  }

  // Destroy cache instance
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// ========================================
// Cache Manager
// ========================================

export class CacheManager {
  private caches = new Map<string, Cache>();

  createCache(name: string, config: Partial<CacheConfig> = {}): Cache {
    if (this.caches.has(name)) {
      return this.caches.get(name)!;
    }

    const cache = new Cache(config);
    this.caches.set(name, cache);
    return cache;
  }

  getCache(name: string): Cache | undefined {
    return this.caches.get(name);
  }

  destroyCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.destroy();
      this.caches.delete(name);
      return true;
    }
    return false;
  }

  async clearAllCaches(): Promise<void> {
    await Promise.all(
      Array.from(this.caches.values()).map(cache => cache.clear())
    );
  }

  getAllCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  async getAllCacheStats() {
    const stats: Record<string, unknown> = {};

    for (const [name, cache] of this.caches) {
      stats[name] = await cache.getInfo();
    }

    return stats;
  }
}

// ========================================
// Default Cache Instances
// ========================================

export const cacheManager = new CacheManager();

// Create default caches for different purposes
export const memoryCache = cacheManager.createCache('memory', {
  storageBackend: 'memory',
  maxSize: 500,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

export const persistentCache = cacheManager.createCache('persistent', {
  storageBackend: 'localStorage',
  maxSize: 200,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
});

export const apiCache = cacheManager.createCache('api', {
  storageBackend: 'indexedDB',
  maxSize: 1000,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
});

// ========================================
// React Hook for Caching
// ========================================

import { useCallback, useEffect, useState } from 'react';

export interface UseCacheOptions {
  cache?: Cache;
  ttl?: number;
  tags?: string[];
  enabled?: boolean;
}

export const useCache = <T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) => {
  const { cache = memoryCache, ttl, tags, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        // Try to get from cache first
        if (!forceRefresh) {
          const cached = await cache.get<T>(key);
          if (cached !== null) {
            setData(cached);
            setLoading(false);
            return cached;
          }
        }

        // Fetch fresh data
        const freshData = await fetcher();

        // Cache the result
        await cache.set(key, freshData, { ttl, tags });

        setData(freshData);
        setLoading(false);
        return freshData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Fetch failed');
        setError(error);
        setLoading(false);
        throw error;
      }
    },
    [key, fetcher, cache, ttl, tags, enabled]
  );

  const invalidate = useCallback(async () => {
    await cache.delete(key);
    return fetchData(true);
  }, [cache, key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate,
  };
};

export default Cache;
