import { useState, useEffect, useRef, useCallback } from 'react';

// Simple accessibility hooks for production use
export const useFocus = () => {
  const focusRef = useRef<HTMLElement>(null);

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const restoreFocus = useCallback(() => {
    // Simple focus restoration
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  }, []);

  return { focusRef, setFocus, restoreFocus };
};

export const useFocusTrap = () => {
  const trapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && trapRef.current) {
        const focusableElements = trapRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return trapRef;
};

export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);

  const announceNavigation = useCallback((page: string) => {
    announce(`Navigated to ${page}`);
  }, [announce]);

  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`);
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceError,
    announceSuccess,
  };
};

export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setIsHighContrast(mediaQuery.matches);
    };

    checkHighContrast();
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addEventListener('change', checkHighContrast);
    
    return () => mediaQuery.removeEventListener('change', checkHighContrast);
  }, []);

  return isHighContrast;
};

export const useMotionPreferences = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkMotionPreference = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    };

    checkMotionPreference();
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkMotionPreference);
    
    return () => mediaQuery.removeEventListener('change', checkMotionPreference);
  }, []);

  return { prefersReducedMotion };
};

export const useAriaId = (prefix = 'aria') => {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
};

export const useKeyboardNavigation = (
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  } = {}
) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        options.onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        options.onSpace?.();
        break;
      case 'Escape':
        event.preventDefault();
        options.onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        options.onArrowRight?.();
        break;
      case 'Home':
        event.preventDefault();
        options.onHome?.();
        break;
      case 'End':
        event.preventDefault();
        options.onEnd?.();
        break;
    }
  }, [options]);

  return { handleKeyDown };
};

export const useDisclosure = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const triggerId = useAriaId('disclosure-trigger');
  const contentId = useAriaId('disclosure-content');

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const getTriggerProps = useCallback(() => ({
    id: triggerId,
    'aria-expanded': isOpen,
    'aria-controls': contentId,
    onClick: toggle,
  }), [triggerId, contentId, isOpen, toggle]);

  const getContentProps = useCallback(() => ({
    id: contentId,
    'aria-labelledby': triggerId,
    hidden: !isOpen,
  }), [contentId, triggerId, isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    getTriggerProps,
    getContentProps,
  };
};

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useFocusTrap();
  const { restoreFocus } = useFocus();
  const { announce } = useScreenReader();

  const open = useCallback(() => {
    setIsOpen(true);
    announce('Modal opened');
    document.body.style.overflow = 'hidden';
  }, [announce]);

  const close = useCallback(() => {
    setIsOpen(false);
    announce('Modal closed');
    restoreFocus();
    document.body.style.overflow = '';
  }, [announce, restoreFocus]);

  useEffect(() => {
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  const { handleKeyDown } = useKeyboardNavigation({
    onEscape: close,
  });

  const getModalProps = useCallback(() => ({
    ref: modalRef,
    role: 'dialog',
    'aria-modal': true,
    onKeyDown: handleKeyDown,
  }), [modalRef, handleKeyDown]);

  return {
    isOpen,
    open,
    close,
    getModalProps,
  };
};

export const useLiveRegion = (politeness: 'polite' | 'assertive' = 'polite') => {
  const [message, setMessage] = useState('');
  const regionId = useAriaId('live-region');

  const announce = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 1000);
  }, []);

  const getLiveRegionProps = useCallback(() => ({
    id: regionId,
    'aria-live': politeness,
    'aria-atomic': true,
    className: 'sr-only',
  }), [regionId, politeness]);

  return {
    message,
    announce,
    getLiveRegionProps,
  };
};