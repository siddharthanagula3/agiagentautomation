/**
 * useVibeAgentActions Hook
 *
 * React hook for tracking agent actions with real-time updates
 * Provides action logging and statistics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  VibeAgentActionService,
  type VibeAgentAction,
  type AgentActionType,
} from '../services/vibe-agent-action-service';

export interface UseVibeAgentActionsOptions {
  sessionId: string | null;
  agentName?: string;
  autoLoad?: boolean;
}

export interface UseVibeAgentActionsReturn {
  actions: VibeAgentAction[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    completed: number;
    failed: number;
    in_progress: number;
    by_type: Record<string, number>;
    by_agent: Record<string, number>;
  };
  logFileEdit: (params: {
    agentName: string;
    filePath: string;
    changes: string;
  }) => Promise<{
    actionId: string;
    complete: (output?: string) => Promise<VibeAgentAction>;
    fail: (error: string) => Promise<VibeAgentAction>;
  }>;
  logCommand: (params: {
    agentName: string;
    command: string;
    cwd?: string;
  }) => Promise<{
    actionId: string;
    complete: (output: string, exitCode?: number) => Promise<VibeAgentAction>;
    fail: (error: string, exitCode?: number) => Promise<VibeAgentAction>;
  }>;
  logAppPreview: (params: {
    agentName: string;
    previewUrl: string;
    port?: number;
  }) => Promise<VibeAgentAction>;
  // Updated: Jan 15th 2026 - Fixed any type
  logToolExecution: (params: {
    agentName: string;
    toolName: string;
    toolInput: Record<string, unknown>;
  }) => Promise<{
    actionId: string;
    complete: (toolOutput: unknown) => Promise<VibeAgentAction>;
    fail: (error: string) => Promise<VibeAgentAction>;
  }>;
  clearActions: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing agent actions
 */
export function useVibeAgentActions(
  options: UseVibeAgentActionsOptions
): UseVibeAgentActionsReturn {
  const { sessionId, agentName, autoLoad = true } = options;

  const [actions, setActions] = useState<VibeAgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    in_progress: 0,
    by_type: {} as Record<string, number>,
    by_agent: {} as Record<string, number>,
  });

  const loadActions = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      let loadedActions: VibeAgentAction[];

      if (agentName) {
        loadedActions = await VibeAgentActionService.getAgentActions(
          sessionId,
          agentName
        );
      } else {
        loadedActions = await VibeAgentActionService.getActions(sessionId);
      }

      setActions(loadedActions);

      // Calculate stats
      const actionStats =
        await VibeAgentActionService.getActionStats(sessionId);
      setStats(actionStats);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to load actions');
      setError(error);
      console.error('[useVibeAgentActions] Load failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, agentName]);

  const logFileEdit = useCallback(
    async (params: {
      agentName: string;
      filePath: string;
      changes: string;
    }) => {
      if (!sessionId) {
        throw new Error('Session ID required to log action');
      }

      return VibeAgentActionService.logFileEdit({
        sessionId,
        ...params,
      });
    },
    [sessionId]
  );

  const logCommand = useCallback(
    async (params: { agentName: string; command: string; cwd?: string }) => {
      if (!sessionId) {
        throw new Error('Session ID required to log action');
      }

      return VibeAgentActionService.logCommandExecution({
        sessionId,
        ...params,
      });
    },
    [sessionId]
  );

  const logAppPreview = useCallback(
    async (params: {
      agentName: string;
      previewUrl: string;
      port?: number;
    }) => {
      if (!sessionId) {
        throw new Error('Session ID required to log action');
      }

      return VibeAgentActionService.logAppPreview({
        sessionId,
        ...params,
      });
    },
    [sessionId]
  );

  const logToolExecution = useCallback(
    async (params: {
      agentName: string;
      toolName: string;
      toolInput: Record<string, unknown>;
    }) => {
      if (!sessionId) {
        throw new Error('Session ID required to log action');
      }

      return VibeAgentActionService.logToolExecution({
        sessionId,
        ...params,
      });
    },
    [sessionId]
  );

  const clearActions = useCallback(async () => {
    if (!sessionId) return;

    try {
      await VibeAgentActionService.clearSessionActions(sessionId);
      setActions([]);
      setStats({
        total: 0,
        completed: 0,
        failed: 0,
        in_progress: 0,
        by_type: {},
        by_agent: {},
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to clear actions');
      setError(error);
      console.error('[useVibeAgentActions] Clear failed:', error);
    }
  }, [sessionId]);

  const refresh = useCallback(async () => {
    await loadActions();
  }, [loadActions]);

  // Auto-load actions on mount
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadActions();
    }
  }, [autoLoad, sessionId, loadActions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = VibeAgentActionService.subscribeToActions(
      sessionId,
      (newAction) => {
        setActions((prev) => {
          // Check if action already exists
          const exists = prev.some((action) => action.id === newAction.id);
          if (exists) {
            // Update existing action
            return prev.map((action) =>
              action.id === newAction.id ? newAction : action
            );
          } else {
            // Add new action
            const updated = [...prev, newAction];
            // Keep sorted by timestamp
            updated.sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            );
            return updated;
          }
        });

        // Recalculate stats
        if (sessionId) {
          VibeAgentActionService.getActionStats(sessionId)
            .then(setStats)
            .catch((err) => {
              console.warn(
                '[useVibeAgentActions] Failed to fetch action stats:',
                err
              );
            });
        }
      },
      (err) => {
        setError(err);
        console.error('[useVibeAgentActions] Subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return {
    actions,
    isLoading,
    error,
    stats,
    logFileEdit,
    logCommand,
    logAppPreview,
    logToolExecution,
    clearActions,
    refresh,
  };
}
