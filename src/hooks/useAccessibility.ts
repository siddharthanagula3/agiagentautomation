import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FocusManager,
  ScreenReaderUtils,
  HighContrastDetector,
  MotionPreferences,
  KEYS,
  ariaHelpers,
} from '../lib/accessibility';

// Hook for managing focus
export const useFocus = () => {
  const focusRef = useRef<HTMLElement>(null);

  const setFocus = useCallback((storePrevious = true) => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  return { focusRef, setFocus, restoreFocus };
};

// Hook for focus trap (useful in modals)
export const useFocusTrap = () => {
  const trapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (trapRef.current) {
        FocusManager.trapFocus(trapRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return trapRef;
};

// Hook for high contrast detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    setIsHighContrast(HighContrastDetector.isHighContrast());
    const cleanup = HighContrastDetector.onHighContrastChange(setIsHighContrast);
    return cleanup;
  }, []);

  return isHighContrast;
};

// Hook for motion preferences
export const useMotionPreferences = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(MotionPreferences.prefersReducedMotion());
    const cleanup = MotionPreferences.onMotionPreferenceChange(setPrefersReducedMotion);
    return cleanup;
  }, []);

  return { prefersReducedMotion };
};

// Hook for screen reader utilities
export const useScreenReader = () => {
  const announce = useCallback((message: string) => {
    ScreenReaderUtils.announce(message);
  }, []);

  const announcePolite = useCallback((message: string) => {
    ScreenReaderUtils.announcePolite(message);
  }, []);

  const announceAssertive = useCallback((message: string) => {
    ScreenReaderUtils.announceAssertive(message);
  }, []);

  return { announce, announcePolite, announceAssertive };
};

// Hook for generating unique ARIA IDs
export const useAriaId = (prefix = 'aria') => {
  const [id] = useState(() => ariaHelpers.generateId(prefix));
  return id;
};

// Hook for keyboard navigation
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
      case KEYS.ENTER:
        event.preventDefault();
        options.onEnter?.();
        break;
      case KEYS.SPACE:
        event.preventDefault();
        options.onSpace?.();
        break;
      case KEYS.ESCAPE:
        event.preventDefault();
        options.onEscape?.();
        break;
      case KEYS.ARROW_UP:
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case KEYS.ARROW_DOWN:
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case KEYS.ARROW_LEFT:
        event.preventDefault();
        options.onArrowLeft?.();
        break;
      case KEYS.ARROW_RIGHT:
        event.preventDefault();
        options.onArrowRight?.();
        break;
      case KEYS.HOME:
        event.preventDefault();
        options.onHome?.();
        break;
      case KEYS.END:
        event.preventDefault();
        options.onEnd?.();
        break;
    }
  }, [options]);

  return { handleKeyDown };
};

// Hook for list navigation (useful for menus, listboxes)
export const useListNavigation = (items: unknown[], options?: { loop?: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { loop = true } = options || {};

  const goToNext = useCallback(() => {
    setActiveIndex(current => {
      if (current === items.length - 1) {
        return loop ? 0 : current;
      }
      return current + 1;
    });
  }, [items.length, loop]);

  const goToPrevious = useCallback(() => {
    setActiveIndex(current => {
      if (current === 0) {
        return loop ? items.length - 1 : current;
      }
      return current - 1;
    });
  }, [items.length, loop]);

  const goToFirst = useCallback(() => {
    setActiveIndex(0);
  }, []);

  const goToLast = useCallback(() => {
    setActiveIndex(items.length - 1);
  }, [items.length]);

  const { handleKeyDown } = useKeyboardNavigation({
    onArrowDown: goToNext,
    onArrowUp: goToPrevious,
    onHome: goToFirst,
    onEnd: goToLast,
  });

  return {
    activeIndex,
    setActiveIndex,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    handleKeyDown,
  };
};

// Hook for managing expanded/collapsed state with ARIA
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

// Hook for managing modal accessibility
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

  const { handleKeyDown } = useKeyboardNavigation({
    onEscape: close,
  });

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

// Hook for live regions
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

// Hook for skip links
export const useSkipLink = () => {
  const skipRef = useRef<HTMLAnchorElement>(null);

  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const getSkipLinkProps = useCallback((targetId: string, label: string) => ({
    ref: skipRef,
    href: `#${targetId}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      skipToContent(targetId);
    },
    className: 'skip-link',
    children: label,
  }), [skipToContent]);

  return {
    skipToContent,
    getSkipLinkProps,
  };
};