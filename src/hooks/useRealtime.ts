import { useEffect, useRef } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../stores/unified-auth-store';

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

  useEffect(() => {
    if (!user?.id || initializedRef.current) return;

    const initializeRealtime = async () => {
      try {
        await realtimeService.initializeRealtime(user.id, callbacks);
        initializedRef.current = true;
        console.log('Real-time subscriptions initialized for user:', user.id);
      } catch (error) {
        console.error('Failed to initialize real-time subscriptions:', error);
        callbacks.onError?.('Failed to initialize real-time updates');
      }
    };

    initializeRealtime();

    // Cleanup on unmount
    return () => {
      if (initializedRef.current) {
        realtimeService.cleanup().catch(console.error);
        initializedRef.current = false;
      }
    };
  }, [user?.id, callbacks]);

  // Reconnect if user changes
  useEffect(() => {
    if (user?.id && initializedRef.current) {
      const reconnect = async () => {
        try {
          await realtimeService.cleanup();
          await realtimeService.initializeRealtime(user.id, callbacks);
          console.log('Real-time subscriptions reconnected for user:', user.id);
        } catch (error) {
          console.error('Failed to reconnect real-time subscriptions:', error);
        }
      };

      reconnect();
    }
  }, [user?.id, callbacks]);

  return {
    isConnected: realtimeService.getConnectionStatus().connected,
    channels: realtimeService.getConnectionStatus().channels,
    reconnect: () => realtimeService.reconnect(user?.id || ''),
    cleanup: () => realtimeService.cleanup()
  };
};
