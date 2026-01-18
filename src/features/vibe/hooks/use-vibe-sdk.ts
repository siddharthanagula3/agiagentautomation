/**
 * useVibeSDK - React hook for VibeSDK integration
 *
 * Provides easy access to VibeSDK features in React components.
 * Handles session management, file operations, and state tracking.
 */

import { useEffect, useCallback, useMemo } from 'react';
import {
  useVibeSDKStore,
  VibeSDKSession,
  type VibeSDKEvent,
  type WorkspaceChange,
} from '../sdk/vibe-sdk-integration';
import type {
  SessionState,
  GenerationState,
  PhaseState,
  FileTreeNode,
} from '../sdk';

export interface UseVibeSDKOptions {
  /** Session ID to use/create */
  sessionId: string | null;
  /** Auto-connect when sessionId is provided */
  autoConnect?: boolean;
  /** Callback for SDK events */
  onEvent?: (event: VibeSDKEvent) => void;
  /** Callback for workspace changes */
  onFileChange?: (change: WorkspaceChange) => void;
  /** Callback for state changes */
  onStateChange?: (state: SessionState) => void;
}

export interface UseVibeSDKReturn {
  // Session
  session: VibeSDKSession | null;
  isConnected: boolean;

  // State
  connectionState: SessionState['connection'];
  generationState: GenerationState;
  phaseState: PhaseState;
  previewUrl: string | null;
  lastError: string | null;

  // Files
  files: Array<{ path: string; content: string }>;
  fileTree: FileTreeNode[];
  fileCount: number;

  // File operations
  writeFile: (path: string, content: string) => void;
  writeFiles: (files: Array<{ path: string; content: string }>) => void;
  readFile: (path: string) => string | null;
  getFilesSnapshot: () => Record<string, string>;

  // Generation control
  startGeneration: (totalFiles?: number) => void;
  completeGeneration: () => void;
  stopGeneration: () => void;

  // Phase control
  setPhase: (
    status: PhaseState['status'],
    name?: string,
    description?: string
  ) => void;

  // Preview control
  startPreview: () => void;
  completePreview: (url: string) => void;

  // Session control
  createSession: (sessionId: string) => VibeSDKSession;
  clearSession: () => void;

  // Computed states
  isGenerating: boolean;
  isIdle: boolean;
  generationProgress: { current: number; total?: number } | null;
}

/**
 * Hook for integrating VibeSDK into React components
 */
export function useVibeSDK(options: UseVibeSDKOptions): UseVibeSDKReturn {
  const {
    sessionId,
    autoConnect = true,
    onEvent,
    onFileChange,
    onStateChange,
  } = options;

  const {
    session,
    connectionState,
    generationState,
    phaseState,
    files,
    fileTree,
    previewUrl,
    lastError,
    createSession,
    clearSession,
    writeFile,
    writeFiles,
    readFile,
    startGeneration,
    completeGeneration,
  } = useVibeSDKStore();

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (!sessionId || !autoConnect) return;

    // Create session if needed
    const existingSession = useVibeSDKStore.getState().session;
    if (
      !existingSession ||
      useVibeSDKStore.getState().sessionId !== sessionId
    ) {
      createSession(sessionId);
    }
  }, [sessionId, autoConnect, createSession]);

  // Subscribe to events
  useEffect(() => {
    const currentSession = useVibeSDKStore.getState().session;
    if (!currentSession) return;

    const unsubscribers: Array<() => void> = [];

    if (onEvent) {
      unsubscribers.push(currentSession.onEvent(onEvent));
    }

    if (onFileChange) {
      unsubscribers.push(currentSession.onWorkspaceChange(onFileChange));
    }

    if (onStateChange) {
      unsubscribers.push(
        currentSession.onStateChange((next) => onStateChange(next))
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [session, onEvent, onFileChange, onStateChange]);

  // Session methods
  const stopGeneration = useCallback(() => {
    const currentSession = useVibeSDKStore.getState().session;
    currentSession?.stopGeneration();
  }, []);

  const setPhase = useCallback(
    (status: PhaseState['status'], name?: string, description?: string) => {
      const currentSession = useVibeSDKStore.getState().session;
      currentSession?.setPhase(status, name, description);
    },
    []
  );

  const startPreview = useCallback(() => {
    const currentSession = useVibeSDKStore.getState().session;
    currentSession?.startPreview();
  }, []);

  const completePreview = useCallback((url: string) => {
    const currentSession = useVibeSDKStore.getState().session;
    currentSession?.completePreview(url);
  }, []);

  const getFilesSnapshot = useCallback(() => {
    const currentSession = useVibeSDKStore.getState().session;
    return currentSession?.getFilesSnapshot() ?? {};
  }, []);

  // Computed values
  const isConnected = connectionState === 'connected';
  const isGenerating = generationState.status === 'running';
  const isIdle = generationState.status === 'idle';
  const fileCount = files.length;

  const generationProgress = useMemo(() => {
    if (
      generationState.status === 'running' ||
      generationState.status === 'complete'
    ) {
      const state = generationState as {
        filesGenerated: number;
        totalFiles?: number;
      };
      return {
        current: state.filesGenerated ?? 0,
        total: state.totalFiles,
      };
    }
    return null;
  }, [generationState]);

  return {
    // Session
    session,
    isConnected,

    // State
    connectionState,
    generationState,
    phaseState,
    previewUrl,
    lastError,

    // Files
    files,
    fileTree,
    fileCount,

    // File operations
    writeFile,
    writeFiles,
    readFile,
    getFilesSnapshot,

    // Generation control
    startGeneration,
    completeGeneration,
    stopGeneration,

    // Phase control
    setPhase,

    // Preview control
    startPreview,
    completePreview,

    // Session control
    createSession,
    clearSession,

    // Computed states
    isGenerating,
    isIdle,
    generationProgress,
  };
}

export default useVibeSDK;
