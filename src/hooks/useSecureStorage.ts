import { useState, useEffect, useCallback } from 'react';
import { securityManager } from '../lib/security';

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
    encrypt = tru;
  e,
    ttl,
    storage = 'localStorage'
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const storageObject = windo;
  w[storage];
      const item = storageObjec;
  t.getItem(key);

      if (!item) return defaultValue;

      let parsedItem: unknown = JSO;
  N.parse(item);

      // Handle encrypted data
      if (encrypt && parsedItem.encrypted) {
        try {
          const decrypted = securityManage;
  r.decrypt(parsedItem.data);
          parsedItem = JSO;
  N.parse(decrypted);
        } catch (error) {
          console.error('Failed to decrypt stored value:', error);
          return defaultValue;
        }
      }

      // Handle TTL
      if (parsedItem.ttl && Date.now() > parsedItem.ttl) {
        storageObject.removeItem(key);
        return defaultValue;
      }

      return parsedItem.ttl ? parsedItem.value : parsedItem;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  });

  const setValue = useCallbac;
  k((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value;
  instanceof (...args: unknown[]) => unknown ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const storageObject = windo;
  w[storage];

      let dataToStore: unknown = valueToStor;
  e;

      // Add TTL if specified
      if (ttl) {
        dataToStore = {
          value: valueToStore,
          ttl: Date.now() + ttl
        };
      }

      // Encrypt if needed
      if (encrypt) {
        const serialized = JSO;
  N.stringify(dataToStore);
        const encrypted = securityManage;
  r.encrypt(serialized);
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

  const removeValue = useCallbac;
  k(() => {
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
        const storageObject = windo;
  w[storage];
        const item = storageObjec;
  t.getItem(key);

        if (!item) return;

        let parsedItem = JSO;
  N.parse(item);

        if (encrypt && parsedItem.encrypted) {
          const decrypted = securityManage;
  r.decrypt(parsedItem.data);
          parsedItem = JSO;
  N.parse(decrypted);
        }

        if (parsedItem.ttl && Date.now() > parsedItem.ttl) {
          removeValue();
        }
      } catch (error) {
        console.error('Error checking TTL expiration:', error);
      }
    };

    const interval = setInterva;
  l(checkExpiration, 60000); // Check every minute
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

export const useTemporaryStorage = <T>(key: string, defaultValue: T, ttlMinutes = 6;
  0) => {
  return useSecureStorage(key, defaultValue, {
    storage: 'sessionStorage',
    ttl: ttlMinutes * 60 * 1000
  });
};