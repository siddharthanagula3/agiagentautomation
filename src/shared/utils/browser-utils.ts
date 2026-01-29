/**
 * Safe Browser API Utilities
 *
 * Provides safe wrappers for browser APIs that may not be available
 * in all environments (SSR, private browsing, older browsers).
 *
 * Created: Jan 23rd 2026
 */

/**
 * Check if we're in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if we're in a Node.js environment
 */
export const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

// ============================================================================
// Safe localStorage Wrapper
// ============================================================================

/**
 * Safe localStorage wrapper that handles:
 * - SSR/Node environments (no window)
 * - Private browsing mode (QuotaExceededError)
 * - localStorage disabled by browser settings
 */
export const safeLocalStorage = {
  /**
   * Get an item from localStorage safely
   */
  getItem(key: string): string | null {
    if (!isBrowser) return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[safeLocalStorage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  /**
   * Set an item in localStorage safely
   */
  setItem(key: string, value: string): boolean {
    if (!isBrowser) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[safeLocalStorage] Failed to set item "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove an item from localStorage safely
   */
  removeItem(key: string): boolean {
    if (!isBrowser) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[safeLocalStorage] Failed to remove item "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage safely
   */
  clear(): boolean {
    if (!isBrowser) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[safeLocalStorage] Failed to clear:', error);
      return false;
    }
  },

  /**
   * Check if localStorage is available and working
   */
  isAvailable(): boolean {
    if (!isBrowser) return false;

    const testKey = '__storage_test__';
    try {
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },
};

// ============================================================================
// Safe sessionStorage Wrapper
// ============================================================================

export const safeSessionStorage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null;

    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`[safeSessionStorage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    if (!isBrowser) return false;

    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[safeSessionStorage] Failed to set item "${key}":`, error);
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (!isBrowser) return false;

    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(
        `[safeSessionStorage] Failed to remove item "${key}":`,
        error
      );
      return false;
    }
  },
};

// ============================================================================
// Safe Clipboard Wrapper
// ============================================================================

/**
 * Legacy clipboard fallback using execCommand
 */
function legacyCopyToClipboard(text: string): boolean {
  if (!isBrowser) return false;

  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (error) {
    console.warn('[safeClipboard] Legacy copy failed:', error);
  }

  document.body.removeChild(textArea);
  return success;
}

/**
 * Safe clipboard wrapper with fallback for older browsers
 */
export const safeClipboard = {
  /**
   * Copy text to clipboard with fallback
   * @returns Promise that resolves to true on success
   */
  async writeText(text: string): Promise<boolean> {
    if (!isBrowser) return false;

    // Try modern Clipboard API first
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn(
          '[safeClipboard] Modern API failed, trying fallback:',
          error
        );
      }
    }

    // Fallback to legacy method
    return legacyCopyToClipboard(text);
  },

  /**
   * Read text from clipboard (requires user permission)
   * @returns Promise that resolves to text or null on failure
   */
  async readText(): Promise<string | null> {
    if (!isBrowser) return null;

    if (navigator?.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        console.warn('[safeClipboard] Read failed:', error);
        return null;
      }
    }

    return null;
  },

  /**
   * Check if clipboard API is available
   */
  isAvailable(): boolean {
    return isBrowser && !!navigator?.clipboard?.writeText;
  },
};

// ============================================================================
// Safe Platform Detection
// ============================================================================

/**
 * Platform detection utilities that avoid deprecated APIs
 */
export const safePlatform = {
  /**
   * Check if running on macOS
   * Uses modern userAgentData API with fallback
   */
  isMac(): boolean {
    if (!isBrowser) return false;

    // Modern API (Chrome 90+, Edge 90+)
    if (navigator.userAgentData?.platform) {
      return navigator.userAgentData.platform === 'macOS';
    }

    // Fallback to userAgent (works everywhere)
    return navigator.userAgent?.includes('Mac') ?? false;
  },

  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    if (!isBrowser) return false;

    if (navigator.userAgentData?.platform) {
      return navigator.userAgentData.platform === 'Windows';
    }

    return navigator.userAgent?.includes('Win') ?? false;
  },

  /**
   * Check if running on Linux
   */
  isLinux(): boolean {
    if (!isBrowser) return false;

    if (navigator.userAgentData?.platform) {
      return navigator.userAgentData.platform === 'Linux';
    }

    return navigator.userAgent?.includes('Linux') ?? false;
  },

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    if (!isBrowser) return false;

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
  },

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    if (!isBrowser) return false;

    return navigator.userAgent?.includes('Android') ?? false;
  },

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return this.isIOS() || this.isAndroid();
  },

  /**
   * Get the modifier key for the platform (Cmd on Mac, Ctrl elsewhere)
   */
  getModifierKey(): 'Meta' | 'Control' {
    return this.isMac() ? 'Meta' : 'Control';
  },

  /**
   * Get the modifier key display string
   */
  getModifierKeyDisplay(): '⌘' | 'Ctrl' {
    return this.isMac() ? '⌘' : 'Ctrl';
  },
};

// ============================================================================
// Safe Window/Document Access
// ============================================================================

/**
 * Safely access window properties
 */
export function safeWindow<K extends keyof Window>(key: K): Window[K] | null {
  if (!isBrowser) return null;
  return window[key] ?? null;
}

/**
 * Safely access document properties
 */
export function safeDocument<K extends keyof Document>(
  key: K
): Document[K] | null {
  if (!isBrowser || typeof document === 'undefined') return null;
  return document[key] ?? null;
}

/**
 * Safely reload the page
 */
export function safeReload(): void {
  if (isBrowser) {
    window.location.reload();
  }
}

/**
 * Safely navigate to a URL
 */
export function safeNavigate(url: string): void {
  if (isBrowser) {
    window.location.href = url;
  }
}

/**
 * Get current URL origin safely
 */
export function safeOrigin(): string {
  if (!isBrowser) return '';
  return window.location.origin;
}

// ============================================================================
// Type augmentation for navigator.userAgentData
// ============================================================================

declare global {
  interface Navigator {
    userAgentData?: {
      platform: string;
      mobile: boolean;
      brands: Array<{ brand: string; version: string }>;
    };
  }
}
