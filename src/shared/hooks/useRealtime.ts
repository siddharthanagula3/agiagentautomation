import { useEffect, useRef, useCallback } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useAuthStore } from '@shared/stores/authentication-store';
import { logger } from '@shared/lib/logger';

export interface RealtimeCallbacks {
  onJobUpdate?: (job: unknown) => void;
  onJobCreated?: (job: unknown) => void;
  onJobDeleted?: (jobId: string) => void;
  onAgentUpdate?: (agent: unknown) => void;
  onNotification?: (notification: unknown) => void;
  onError?: (error: string) => void;
}

export const useRealtime = (callbacks: RealtimeCallbacks = {}) => {
  const { user } = useAuthStore();
  const initializedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  // Store callbacks in a ref to avoid triggering effects on callback reference changes
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref in an effect to avoid ref access during render
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  // Initialize realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Skip if already initialized for this user
    if (initializedRef.current && previousUserIdRef.current === user.id) {
      return;
    }

    let isMounted = true;

    const initializeRealtime = async () => {
      try {
        // If user changed, cleanup previous subscriptions first
        if (
          initializedRef.current &&
          previousUserIdRef.current &&
          previousUserIdRef.current !== user.id
        ) {
          await realtimeService.cleanup();
        }

        await realtimeService.initializeRealtime(user.id, callbacksRef.current);

        if (isMounted) {
          initializedRef.current = true;
          previousUserIdRef.current = user.id;
          console.log('Real-time subscriptions initialized for user:', user.id);
        }
      } catch (error) {
        console.error('Failed to initialize real-time subscriptions:', error);
        callbacksRef.current.onError?.(
          'Failed to initialize real-time updates'
        );
      }
    };

    initializeRealtime();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (initializedRef.current) {
        realtimeService.cleanup().catch((error) => {
          logger.error('[useRealtime] Cleanup failed', error);
        });
        initializedRef.current = false;
        previousUserIdRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id, not callbacks

  // Memoize reconnect function
  const reconnect = useCallback(() => {
    return realtimeService.reconnect(user?.id || '');
  }, [user?.id]);

  // Memoize cleanup function
  const cleanup = useCallback(() => {
    return realtimeService.cleanup();
  }, []);

  return {
    isConnected: realtimeService.getConnectionStatus().connected,
    channels: realtimeService.getConnectionStatus().channels,
    reconnect,
    cleanup,
  };
};
