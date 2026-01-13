import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@shared/lib/supabase-client';
import { useVibeViewStore } from '../stores/vibe-view-store';
import {
  buildFileTree,
  mapFileRowToMetadata,
  type VibeFileRow,
} from '../utils/file-tree';

type AgentActionStatus = 'in_progress' | 'completed' | 'failed';

export interface VibeAgentActionRow {
  id: string;
  session_id: string;
  agent_name: string;
  action_type: string;
  timestamp: string;
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown> | null;
  status?: AgentActionStatus | null;
  result?: Record<string, unknown> | null;
  error?: string | null;
}

/**
 * Type-safe interface for command action metadata fields
 */
interface CommandActionMetadata {
  command?: string;
  label?: string;
  title?: string;
  output?: string;
  stdout?: string;
  exit_code?: number;
  code?: number;
}

/**
 * Type-safe interface for command action result fields
 */
interface CommandActionResult {
  output?: string;
  exit_code?: number;
}

/**
 * Type-safe interface for app preview metadata fields
 */
interface AppPreviewMetadata {
  preview_url?: string;
  url?: string;
  endpoint?: string;
}

/**
 * Type guard to safely extract command metadata from VibeAgentActionRow
 */
function getCommandMetadata(
  metadata: Record<string, unknown> | null | undefined
): CommandActionMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const result: CommandActionMetadata = {};

  if (typeof metadata.command === 'string') {
    result.command = metadata.command;
  }
  if (typeof metadata.label === 'string') {
    result.label = metadata.label;
  }
  if (typeof metadata.title === 'string') {
    result.title = metadata.title;
  }
  if (typeof metadata.output === 'string') {
    result.output = metadata.output;
  }
  if (typeof metadata.stdout === 'string') {
    result.stdout = metadata.stdout;
  }
  if (typeof metadata.exit_code === 'number') {
    result.exit_code = metadata.exit_code;
  }
  if (typeof metadata.code === 'number') {
    result.code = metadata.code;
  }

  return result;
}

/**
 * Type guard to safely extract command result from VibeAgentActionRow
 */
function getCommandResult(
  result: Record<string, unknown> | null | undefined
): CommandActionResult {
  if (!result || typeof result !== 'object') {
    return {};
  }

  const validated: CommandActionResult = {};

  if (typeof result.output === 'string') {
    validated.output = result.output;
  }
  if (typeof result.exit_code === 'number') {
    validated.exit_code = result.exit_code;
  }

  return validated;
}

/**
 * Type guard to safely extract app preview metadata from VibeAgentActionRow
 */
function getAppPreviewMetadata(
  metadata: Record<string, unknown> | null | undefined
): AppPreviewMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const result: AppPreviewMetadata = {};

  if (typeof metadata.preview_url === 'string') {
    result.preview_url = metadata.preview_url;
  }
  if (typeof metadata.url === 'string') {
    result.url = metadata.url;
  }
  if (typeof metadata.endpoint === 'string') {
    result.endpoint = metadata.endpoint;
  }

  return result;
}

interface UseVibeRealtimeOptions {
  sessionId?: string | null;
  onAction?: (action: VibeAgentActionRow) => void;
}

const toTerminalStatus = (
  status?: AgentActionStatus | null
): 'running' | 'completed' | 'failed' => {
  if (status === 'completed') return 'completed';
  if (status === 'failed') return 'failed';
  return 'running';
};

export function useVibeRealtime({
  sessionId,
  onAction,
}: UseVibeRealtimeOptions) {
  const setFileMetadata = useVibeViewStore((state) => state.setFileMetadata);
  const upsertFileMetadata = useVibeViewStore(
    (state) => state.upsertFileMetadata
  );
  const removeFileMetadata = useVibeViewStore(
    (state) => state.removeFileMetadata
  );
  const setFileTree = useVibeViewStore((state) => state.setFileTree);
  const addTerminalCommand = useVibeViewStore(
    (state) => state.addTerminalCommand
  );
  const updateTerminalCommand = useVibeViewStore(
    (state) => state.updateTerminalCommand
  );
  const setAppViewerUrl = useVibeViewStore((state) => state.setAppViewerUrl);
  const updateAppViewerState = useVibeViewStore(
    (state) => state.updateAppViewerState
  );

  const commandMap = useRef<Map<string, string>>(new Map());

  const rebuildTree = useCallback(() => {
    const metadataValues = Array.from(
      useVibeViewStore.getState().fileMetadata.values()
    );
    setFileTree(buildFileTree(metadataValues));
  }, [setFileTree]);

  const loadInitialFiles = useCallback(
    async (currentSessionId: string) => {
      const { data, error } = await supabase
        .from('vibe_files')
        .select('id,name,url,metadata,size,uploaded_at')
        .eq('session_id', currentSessionId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.error('[VIBE] Failed to load files:', error);
        return;
      }

      const metadataList = (data as VibeFileRow[] | null)?.map(
        mapFileRowToMetadata
      );

      if (metadataList) {
        setFileMetadata(metadataList);
        setFileTree(buildFileTree(metadataList));
      } else {
        setFileMetadata([]);
        setFileTree([]);
      }
    },
    [setFileMetadata, setFileTree]
  );

  useEffect(() => {
    // Defensive: Ensure sessionId is a valid string
    if (!sessionId || typeof sessionId !== 'string') return;

    loadInitialFiles(sessionId);

    const filesChannel = supabase
      .channel(`vibe-files-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_files',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const metadata = mapFileRowToMetadata(payload.new as VibeFileRow);
            upsertFileMetadata(metadata);
            rebuildTree();
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const metadata = mapFileRowToMetadata(payload.new as VibeFileRow);
            upsertFileMetadata(metadata);
            rebuildTree();
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const previous = mapFileRowToMetadata(payload.old as VibeFileRow);
            removeFileMetadata(previous.path);
            rebuildTree();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[VIBE] Failed to subscribe to file updates');
        }
      });

    return () => {
      supabase.removeChannel(filesChannel);
    };
  }, [
    loadInitialFiles,
    rebuildTree,
    removeFileMetadata,
    sessionId,
    upsertFileMetadata,
  ]);

  useEffect(() => {
    // Defensive: Ensure sessionId is a valid string
    if (!sessionId || typeof sessionId !== 'string') return;

    // Updated: Nov 16th 2025 - Fixed memory leak by clearing completed commands after delay
    // Updated: Jan 2026 - Added type guards to safely extract metadata and result
    const handleCommandAction = (action: VibeAgentActionRow) => {
      if (action.action_type !== 'command_execution') return;

      // Use type guards to safely extract metadata and result
      const meta = getCommandMetadata(action.metadata);
      const result = getCommandResult(action.result);

      if (!commandMap.current.has(action.id)) {
        const newId = addTerminalCommand({
          command: meta.command || meta.label || meta.title || 'Command',
          output: meta.output || result.output || meta.stdout || '',
          status: toTerminalStatus(action.status),
          exitCode: meta.exit_code ?? result.exit_code ?? meta.code,
        });

        commandMap.current.set(action.id, newId);
      } else {
        const commandId = commandMap.current.get(action.id);
        if (commandId) {
          updateTerminalCommand(commandId, {
            status: toTerminalStatus(action.status),
            output: result.output || meta.output || meta.stdout || '',
            exitCode: meta.exit_code ?? result.exit_code ?? meta.code,
          });
        }
      }

      // Clear completed commands from map after 5 minutes to prevent memory leak
      if (action.status === 'completed' || action.status === 'failed') {
        setTimeout(
          () => {
            commandMap.current.delete(action.id);
          },
          5 * 60 * 1000
        );
      }
    };

    const handleAppPreview = (action: VibeAgentActionRow) => {
      if (action.action_type !== 'app_preview') return;

      // Use type guard to safely extract preview metadata
      const meta = getAppPreviewMetadata(action.metadata);
      const previewUrl = meta.preview_url || meta.url || meta.endpoint;

      if (previewUrl) {
        setAppViewerUrl(previewUrl);
        updateAppViewerState({
          isLoading: action.status === 'in_progress',
        });
      }
    };

    const actionsChannel = supabase
      .channel(`vibe-agent-actions-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_agent_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const action =
            (payload.new as VibeAgentActionRow | null) ||
            (payload.old as VibeAgentActionRow | null);
          if (!action) return;

          handleCommandAction(action);
          handleAppPreview(action);
          if (onAction) {
            onAction(action);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[VIBE] Failed to subscribe to agent actions');
        }
      });

    return () => {
      supabase.removeChannel(actionsChannel);
    };
  }, [
    addTerminalCommand,
    onAction,
    sessionId,
    setAppViewerUrl,
    updateAppViewerState,
    updateTerminalCommand,
  ]);

  useEffect(() => {
    // Clear command map when session changes
    if (sessionId) {
      commandMap.current.clear();
    }
  }, [sessionId]);
}
