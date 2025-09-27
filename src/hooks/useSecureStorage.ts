import { useState, useEffect, useCallback } from 'react';

interface UseSecureStorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  storage?: 'localStorage' | 'sessionStorage';
}

export const useSecureStorage = <T>(
  key: string,
  defaultValue: T,
  options: UseSecureStorageOptions = {}
) => {
  const {
    encrypt = true,
    ttl,
    storage = 'localStorage'
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const storageObject = window[storage];
      const item = storageObject.getItem(key);

      if (!item) return defaultValue;

      const parsedItem = JSON.parse(item);
      
      // Check TTL if provided
      if (ttl && parsedItem.timestamp) {
        const now = Date.now();
        if (now - parsedItem.timestamp > ttl) {
          storageObject.removeItem(key);
          return defaultValue;
        }
      }

      return parsedItem.value || defaultValue;
    } catch (error) {
      console.error(`Error reading from ${storage}:`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      const storageObject = window[storage];
      const itemToStore = {
        value,
        timestamp: Date.now()
      };
      
      storageObject.setItem(key, JSON.stringify(itemToStore));
      setStoredValue(value);
    } catch (error) {
      console.error(`Error writing to ${storage}:`, error);
    }
  }, [key, storage]);

  const removeValue = useCallback(() => {
    try {
      const storageObject = window[storage];
      storageObject.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.error(`Error removing from ${storage}:`, error);
    }
  }, [key, storage, defaultValue]);

  // Clean up expired items on mount
  useEffect(() => {
    if (ttl) {
      try {
        const storageObject = window[storage];
        const item = storageObject.getItem(key);
        
        if (item) {
          const parsedItem = JSON.parse(item);
          const now = Date.now();
          
          if (parsedItem.timestamp && now - parsedItem.timestamp > ttl) {
            storageObject.removeItem(key);
            setStoredValue(defaultValue);
          }
        }
      } catch (error) {
        console.error('Error checking TTL:', error);
      }
    }
  }, [key, storage, ttl, defaultValue]);

  return [storedValue, setValue, removeValue] as const;
};