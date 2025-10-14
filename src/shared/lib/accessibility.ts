/**
 * Accessibility utilities and helpers
 * Provides ARIA attributes, focus management, and screen reader support
 */

// ARIA live regions for dynamic content
export const ARIA_LIVE = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off',
} as const;

// Common ARIA roles
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  DIALOG: 'dialog',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  BANNER: 'banner',
  REGION: 'region',
  PROGRESSBAR: 'progressbar',
  STATUS: 'status',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',
} as const;

// Keyboard keys for navigation
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  TAB: 'Tab',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusHistory: HTMLElement[] = [];

  // Store current focus and set focus to new element
  static setFocus(element: HTMLElement | null, storePrevious = true): void {
    if (!element) return;

    if (storePrevious) {
      const currentFocus = document.activeElement as HTMLElement;
      if (currentFocus && currentFocus !== element) {
        this.focusHistory.push(currentFocus);
      }
    }

    element.focus();
  }

  // Restore focus to the previously focused element
  static restoreFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }

  // Get all focusable elements within a container
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details',
      'summary',
      '[contenteditable="true"]',
    ].join(',');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  // Trap focus within a container (useful for modals)
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== KEYS.TAB) return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      // Shift + Tab: move to previous element
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move to next element
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  private static announceElement: HTMLElement | null = null;

  // Initialize announcement element
  static init(): void {
    if (this.announceElement) return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('class', 'sr-only');
    this.announceElement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announceElement);
  }

  // Announce message to screen readers
  static announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    this.init();
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }

  // Announce navigation changes
  static announceNavigation(page: string): void {
    this.announce(`Navigated to ${page}`);
  }

  // Announce form errors
  static announceError(message: string): void {
    this.announce(`Error: ${message}`, 'assertive');
  }

  // Announce success messages
  static announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }
}

// High contrast mode detection
export class HighContrastDetector {
  static isHighContrastMode(): boolean {
    // Check for Windows high contrast mode
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return true;
    }

    // Check for forced colors mode (Windows High Contrast)
    if (window.matchMedia('(forced-colors: active)').matches) {
      return true;
    }

    // Fallback detection method
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      top: -9999px;
      width: 1px;
      height: 1px;
      background-color: rgb(31, 32, 33);
      border: 1px solid rgb(31, 32, 33);
    `;
    document.body.appendChild(testElement);

    const computedStyle = window.getComputedStyle(testElement);
    const isHighContrast =
      computedStyle.backgroundColor !== computedStyle.borderColor;

    document.body.removeChild(testElement);
    return isHighContrast;
  }

  static onHighContrastChange(
    callback: (isHighContrast: boolean) => void
  ): () => void {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    const handler = () => callback(this.isHighContrastMode());

    mediaQuery.addListener(handler);
    forcedColorsQuery.addListener(handler);

    return () => {
      mediaQuery.removeListener(handler);
      forcedColorsQuery.removeListener(handler);
    };
  }
}

// Motion preferences
export class MotionPreferences {
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static onMotionPreferenceChange(
    callback: (prefersReduced: boolean) => void
  ): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => callback(mediaQuery.matches);

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}

// ARIA attribute helpers
export const ariaHelpers = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'aria'): string => {
    return `${prefix}-${crypto.randomUUID()}`;
  },

  // Create describedby relationship
  createDescribedBy: (
    elementId: string,
    descriptionId: string
  ): Record<string, string> => ({
    id: elementId,
    'aria-describedby': descriptionId,
  }),

  // Create labelledby relationship
  createLabelledBy: (
    elementId: string,
    labelId: string
  ): Record<string, string> => ({
    id: elementId,
    'aria-labelledby': labelId,
  }),

  // Create expanded state for collapsible elements
  createExpandedState: (isExpanded: boolean): Record<string, string> => ({
    'aria-expanded': String(isExpanded),
  }),

  // Create selected state for selectable elements
  createSelectedState: (isSelected: boolean): Record<string, string> => ({
    'aria-selected': String(isSelected),
  }),

  // Create checked state for checkable elements
  createCheckedState: (
    isChecked: boolean | 'mixed'
  ): Record<string, string> => ({
    'aria-checked': String(isChecked),
  }),

  // Create disabled state
  createDisabledState: (isDisabled: boolean): Record<string, string> => ({
    'aria-disabled': String(isDisabled),
    ...(isDisabled && { tabIndex: -1 }),
  }),

  // Create hidden state
  createHiddenState: (isHidden: boolean): Record<string, string> => ({
    'aria-hidden': String(isHidden),
    ...(isHidden && { tabIndex: -1 }),
  }),

  // Create live region attributes
  createLiveRegion: (
    politeness: 'polite' | 'assertive' | 'off' = 'polite'
  ): Record<string, string> => ({
    'aria-live': politeness,
    'aria-atomic': 'true',
  }),

  // Create loading state
  createLoadingState: (
    isLoading: boolean,
    label = 'Loading'
  ): Record<string, string> => ({
    'aria-busy': String(isLoading),
    ...(isLoading && { 'aria-label': label }),
  }),
};

// Color contrast utilities
export class ContrastUtils {
  // Calculate relative luminance
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Convert hex to RGB
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // Check if contrast meets WCAG standards
  static meetsWCAG(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  }
}

// Initialize screen reader utilities when module loads
if (typeof window !== 'undefined') {
  ScreenReaderUtils.init();
}
