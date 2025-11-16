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
  metadata?: Record<string, any> | null;
  status?: AgentActionStatus | null;
  result?: Record<string, any> | null;
  error?: string | null;
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
    if (!sessionId) return;

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
            const metadata = mapFileRowToMetadata(
              payload.new as VibeFileRow
            );
            upsertFileMetadata(metadata);
            rebuildTree();
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const metadata = mapFileRowToMetadata(
              payload.new as VibeFileRow
            );
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
  }, [loadInitialFiles, rebuildTree, removeFileMetadata, sessionId, upsertFileMetadata]);

  useEffect(() => {
    if (!sessionId) return;

    const handleCommandAction = (action: VibeAgentActionRow) => {
      if (action.action_type !== 'command_execution') return;

      if (!commandMap.current.has(action.id)) {
        const newId = addTerminalCommand({
          command:
            action.metadata?.command ||
            action.metadata?.label ||
            action.metadata?.title ||
            'Command',
          output:
            action.metadata?.output ||
            action.result?.output ||
            action.metadata?.stdout ||
            '',
          status: toTerminalStatus(action.status),
          exitCode:
            action.metadata?.exit_code ??
            action.result?.exit_code ??
            action.metadata?.code,
        });

        commandMap.current.set(action.id, newId);
      } else {
        const commandId = commandMap.current.get(action.id);
        if (commandId) {
          updateTerminalCommand(commandId, {
            status: toTerminalStatus(action.status),
            output:
              action.result?.output ||
              action.metadata?.output ||
              action.metadata?.stdout ||
              '',
            exitCode:
              action.metadata?.exit_code ??
              action.result?.exit_code ??
              action.metadata?.code,
          });
        }
      }
    };

    const handleAppPreview = (action: VibeAgentActionRow) => {
      if (action.action_type !== 'app_preview') return;
      const previewUrl =
        action.metadata?.preview_url ||
        action.metadata?.url ||
        action.metadata?.endpoint;

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
}
  useEffect(() => {
    commandMap.current.clear();
  }, [sessionId]);
