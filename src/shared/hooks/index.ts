// Shared Hooks - Public API

// Mobile detection
export { useIsMobile } from './use-mobile';

// Toast notifications
export { useToast, toast } from './use-toast';

// Accessibility hooks
export {
  useAccessibility,
  useKeyboardNavigation,
  useAriaAttributes,
  useScreenReaderAnnouncements,
  useColorContrast,
} from './useAccessibility';

// Analytics hooks
export {
  useAnalytics,
  useInteractionTracking,
  useBusinessMetrics,
} from './useAnalytics';

// Auto-scroll behavior
export { useAutoScroll } from './useAutoScroll';

// Chat state management
export {
  useChatState,
  type ChatMessage,
  type ChatTab,
  type ChatState,
} from './useChatState';

// Performance optimization hooks
export {
  usePerformanceOptimization,
  useDebounce,
  useThrottle,
  useMemoizedValue,
  useLazyComponent,
  useVirtualizedList,
  useOptimizedImage,
  useResourcePreloader,
  useComponentPerformance,
} from './usePerformanceOptimization';

// Realtime subscriptions
export { useRealtime, type RealtimeCallbacks } from './useRealtime';

// Theme context
export { useThemeContext } from './useThemeContext';

// Session timeout enforcement
export {
  useSessionTimeout,
  type SessionTimeoutState,
  type UseSessionTimeoutOptions,
  type UseSessionTimeoutReturn,
} from './useSessionTimeout';
