import { useEffect, useCallback, useRef } from 'react';
import { accessibilityService } from '@core/monitoring/accessibility-monitor';

interface AccessibilityOptions {
  announceChanges?: boolean;
  trackInteractions?: boolean;
  manageFocus?: boolean;
}

/**
 * Hook for accessibility features
 */
export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    announceChanges = true,
    trackInteractions = true,
    manageFocus = true,
  } = options;

  const previousFocusRef = useRef<Element | null>(null);

  // Initialize accessibility service
  useEffect(() => {
    accessibilityService.initialize();
  }, []);

  // Announce changes to screen readers
  const announce = useCallback(
    (message: string) => {
      if (announceChanges) {
        accessibilityService.announce(message);
      }
    },
    [announceChanges]
  );

  // Track user interactions for accessibility analytics
  const trackInteraction = useCallback(
    (action: string, target: string, properties?: Record<string, unknown>) => {
      if (trackInteractions) {
        // This would integrate with your analytics service
        console.log('Accessibility interaction:', {
          action,
          target,
          properties,
        });
      }
    },
    [trackInteractions]
  );

  // Manage focus for better keyboard navigation
  const manageFocusRef = useCallback(
    (element: HTMLElement | null) => {
      if (manageFocus && element) {
        previousFocusRef.current = document.activeElement;
        element.focus();
      }
    },
    [manageFocus]
  );

  // Restore previous focus
  const restoreFocus = useCallback(() => {
    if (manageFocus && previousFocusRef.current) {
      (previousFocusRef.current as HTMLElement).focus();
      previousFocusRef.current = null;
    }
  }, [manageFocus]);

  // Trap focus within an element
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    announce,
    trackInteraction,
    manageFocusRef,
    restoreFocus,
    trapFocus,
  };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = () => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent, handlers: Record<string, () => void>) => {
      const handler = handlers[event.key];
      if (handler) {
        handler();
        event.preventDefault();
      }
    },
    []
  );

  const handleArrowKeys = useCallback(
    (
      event: KeyboardEvent,
      onUp?: () => void,
      onDown?: () => void,
      onLeft?: () => void,
      onRight?: () => void
    ) => {
      switch (event.key) {
        case 'ArrowUp':
          onUp?.();
          event.preventDefault();
          break;
        case 'ArrowDown':
          onDown?.();
          event.preventDefault();
          break;
        case 'ArrowLeft':
          onLeft?.();
          event.preventDefault();
          break;
        case 'ArrowRight':
          onRight?.();
          event.preventDefault();
          break;
      }
    },
    []
  );

  const handleEscape = useCallback(
    (event: KeyboardEvent, onEscape: () => void) => {
      if (event.key === 'Escape') {
        onEscape();
        event.preventDefault();
      }
    },
    []
  );

  const handleEnter = useCallback(
    (event: KeyboardEvent, onEnter: () => void) => {
      if (event.key === 'Enter') {
        onEnter();
        event.preventDefault();
      }
    },
    []
  );

  return {
    handleKeyDown,
    handleArrowKeys,
    handleEscape,
    handleEnter,
  };
};

/**
 * Hook for ARIA attributes management
 */
export const useAriaAttributes = () => {
  const setAriaExpanded = useCallback(
    (element: HTMLElement, expanded: boolean) => {
      element.setAttribute('aria-expanded', expanded.toString());
    },
    []
  );

  const setAriaSelected = useCallback(
    (element: HTMLElement, selected: boolean) => {
      element.setAttribute('aria-selected', selected.toString());
    },
    []
  );

  const setAriaHidden = useCallback((element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', hidden.toString());
  }, []);

  const setAriaLabel = useCallback((element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label);
  }, []);

  const setAriaDescribedBy = useCallback(
    (element: HTMLElement, describedBy: string) => {
      element.setAttribute('aria-describedby', describedBy);
    },
    []
  );

  const setAriaLabelledBy = useCallback(
    (element: HTMLElement, labelledBy: string) => {
      element.setAttribute('aria-labelledby', labelledBy);
    },
    []
  );

  const setAriaLive = useCallback(
    (element: HTMLElement, live: 'off' | 'polite' | 'assertive') => {
      element.setAttribute('aria-live', live);
    },
    []
  );

  const setAriaAtomic = useCallback((element: HTMLElement, atomic: boolean) => {
    element.setAttribute('aria-atomic', atomic.toString());
  }, []);

  return {
    setAriaExpanded,
    setAriaSelected,
    setAriaHidden,
    setAriaLabel,
    setAriaDescribedBy,
    setAriaLabelledBy,
    setAriaLive,
    setAriaAtomic,
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReaderAnnouncements = () => {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    []
  );

  const announceError = useCallback(
    (message: string) => {
      announce(message, 'assertive');
    },
    [announce]
  );

  const announceSuccess = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  const announceInfo = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  return {
    announce,
    announceError,
    announceSuccess,
    announceInfo,
  };
};

/**
 * Hook for color contrast checking
 */
export const useColorContrast = () => {
  const checkContrast = useCallback(
    (foreground: string, background: string): number => {
      // Simplified contrast ratio calculation
      // In a real implementation, you'd use a proper color contrast library
      const getLuminance = (color: string): number => {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        // Apply gamma correction
        const [rs, gs, bs] = [r, g, b].map((c) =>
          c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const lum1 = getLuminance(foreground);
      const lum2 = getLuminance(background);

      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);

      return (brightest + 0.05) / (darkest + 0.05);
    },
    []
  );

  const isContrastSufficient = useCallback(
    (
      foreground: string,
      background: string,
      level: 'AA' | 'AAA' = 'AA'
    ): boolean => {
      const ratio = checkContrast(foreground, background);
      return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
    },
    [checkContrast]
  );

  return {
    checkContrast,
    isContrastSufficient,
  };
};
