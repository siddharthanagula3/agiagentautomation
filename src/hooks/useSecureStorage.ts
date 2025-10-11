import { useState, useEffect, useCallback } from 'react';
import { securityManager } from '../lib/security';

interface UseSecureStorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  storage?: 'localStorage' | 'sessionStorage';
}

interface StoredItem<T> {
  value: T;
  ttl?: number;
}

interface EncryptedStoredItem {
  encrypted: true;
  data: string;
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

      let parsedItem: StoredItem<T> | EncryptedStoredItem | T = JSON.parse(item);

      // Handle encrypted data
      if (encrypt && 'encrypted' in parsedItem && parsedItem.encrypted) {
        try {
          const decrypted = securityManager.decrypt(parsedItem.data);
          parsedItem = JSON.parse(decrypted);
        } catch (error) {
          console.error('Failed to decrypt stored value:', error);
          return defaultValue;
        }
      }

      // Handle TTL
      if ('ttl' in parsedItem && parsedItem.ttl && Date.now() > parsedItem.ttl) {
        storageObject.removeItem(key);
        return defaultValue;
      }

      return 'value' in parsedItem ? parsedItem.value : parsedItem as T;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const storageObject = window[storage];

      let dataToStore: StoredItem<T> | EncryptedStoredItem | T = valueToStore;

      // Add TTL if specified
      if (ttl) {
        dataToStore = {
          value: valueToStore,
          ttl: Date.now() + ttl
        };
      }

      // Encrypt if needed
      if (encrypt) {
        const serialized = JSON.stringify(dataToStore);
        const encrypted = securityManager.encrypt(serialized);
        dataToStore = {
          encrypted: true,
          data: encrypted
        };
      }

      storageObject.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  }, [key, storedValue, encrypt, ttl, storage]);

  const removeValue = useCallback(() => {
    try {
      window[storage].removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }, [key, defaultValue, storage]);

  // Check for TTL expiration
  useEffect(() => {
    if (!ttl) return;

    const checkExpiration = () => {
      try {
        const storageObject = window[storage];
        const item = storageObject.getItem(key);

        if (!item) return;

        let parsedItem: StoredItem<T> | EncryptedStoredItem | T = JSON.parse(item);

        if (encrypt && 'encrypted' in parsedItem && parsedItem.encrypted) {
          const decrypted = securityManager.decrypt(parsedItem.data);
          parsedItem = JSON.parse(decrypted);
        }

        if ('ttl' in parsedItem && parsedItem.ttl && Date.now() > parsedItem.ttl) {
          removeValue();
        }
      } catch (error) {
        console.error('Error checking TTL expiration:', error);
      }
    };

    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [key, ttl, encrypt, storage, removeValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Specialized hooks for common use cases
export const useSecureSessionStorage = <T>(key: string, defaultValue: T) => {
  return useSecureStorage(key, defaultValue, { storage: 'sessionStorage' });
};

export const useSecureLocalStorage = <T>(key: string, defaultValue: T, ttl?: number) => {
  return useSecureStorage(key, defaultValue, { storage: 'localStorage', ttl });
};

export const useTemporaryStorage = <T>(key: string, defaultValue: T, ttlMinutes = 60) => {
  return useSecureStorage(key, defaultValue, {
    storage: 'sessionStorage',
    ttl: ttlMinutes * 60 * 1000
  });
};