/**
 * VibeDashboard - Redesigned AI Development Agent Interface
 * Inspired by: Lovable.dev, Bolt.new, Replit.com, Emergent.sh
 *
 * Layout:
 * - Left (30%): Chat interface only
 * - Right (70%): Split into Code Editor (60%) + Live Preview (40%)
 * - Mobile: Stack vertically
 *
 * Updated: Nov 18th 2025 - Complete redesign
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useWorkforceStore } from '@shared/stores/workforce-store';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { useVibeViewStore } from '../stores/vibe-view-store';
import { VibeLayout } from '../layouts/VibeLayout';
import { SimpleChatPanel } from '../components/redesign/SimpleChatPanel';
import { CodeEditorPanel } from '../components/redesign/CodeEditorPanel';
import { LivePreviewPanel } from '../components/redesign/LivePreviewPanel';
import {
  VibeEnhancedComposer,
  type VibeMode,
} from '../components/redesign/VibeEnhancedComposer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Loader2, GripVertical, Sparkles } from 'lucide-react';
import type { AgentStatus } from '../components/agent-panel/AgentStatusCard';
import type { WorkingStep } from '../components/agent-panel/WorkingProcessSection';
import type { AgentMessage } from '../components/agent-panel/AgentMessageList';
import { supabase } from '@shared/lib/supabase-client';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import {
  useVibeRealtime,
  type VibeAgentActionRow,
} from '../hooks/use-vibe-realtime';
import { VibeMessageService } from '../services/vibe-message-service';
import { vibeMessageHandler } from '../services/vibe-message-handler';
import { toast } from 'sonner';
import { PhaseTimeline } from '../components/redesign/PhaseTimeline';
import { useVibeOrchestrator } from '../services/vibe-phase-orchestrator';
import { TokenUsageDisplay } from '../components/TokenUsageDisplay';
import { useVibeKeyboardShortcuts } from '../hooks/use-vibe-keyboard-shortcuts';
import { VibeKeyboardShortcutsDialog } from '../components/VibeKeyboardShortcutsDialog';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Button } from '@shared/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

// Error fallback component for Vibe page
const VibeErrorFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
    <div className="max-w-md text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Vibe Workspace Error</h2>
      <p className="mb-6 text-muted-foreground">
        Something went wrong in the Vibe AI development workspace. Your work may
        not have been saved.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reload Workspace
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  </div>
);

interface VibeMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  user_id?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  employee_role?: string | null;
  timestamp?: string | null;
  // Updated: Jan 15th 2026 - Fixed any type
  metadata?: Record<string, unknown> | null;
  is_streaming?: boolean | null;
}

/**
 * Type-safe interface for VibeAgentAction metadata fields
 */
interface AgentActionMetadata {
  summary?: string;
  description?: string;
  command?: string;
  agent_role?: string;
  is_streaming?: boolean;
}

/**
 * Type-safe interface for VibeAgentAction result fields
 */
interface AgentActionResult {
  output?: string;
  summary?: string;
}

/**
 * Type guard to safely extract metadata from VibeAgentActionRow
 */
function getValidatedActionMetadata(
  metadata: Record<string, unknown> | null | undefined
): AgentActionMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const result: AgentActionMetadata = {};

  if (typeof metadata.summary === 'string') {
    result.summary = metadata.summary;
  }
  if (typeof metadata.description === 'string') {
    result.description = metadata.description;
  }
  if (typeof metadata.command === 'string') {
    result.command = metadata.command;
  }
  if (typeof metadata.agent_role === 'string') {
    result.agent_role = metadata.agent_role;
  }
  if (typeof metadata.is_streaming === 'boolean') {
    result.is_streaming = metadata.is_streaming;
  }

  return result;
}

/**
 * Type guard to safely extract result from VibeAgentActionRow
 */
function getValidatedActionResult(
  result: Record<string, unknown> | null | undefined
): AgentActionResult {
  if (!result || typeof result !== 'object') {
    return {};
  }

  const validated: AgentActionResult = {};

  if (typeof result.output === 'string') {
    validated.output = result.output;
  }
  if (typeof result.summary === 'string') {
    validated.summary = result.summary;
  }

  return validated;
}

/**
 * Type guard to safely extract is_streaming from VibeMessageRow metadata
 */
function getMessageIsStreaming(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  return typeof metadata.is_streaming === 'boolean'
    ? metadata.is_streaming
    : false;
}

// Removed OutputPanel - using new CodeEditorPanel and LivePreviewPanel instead

const VibeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hiredEmployees } = useWorkforceStore();
  const { currentSessionId, setCurrentSession } = useVibeChatStore();

  // Phase orchestrator for VibeSDK-style workflow tracking
  const {
    session: orchestratorSession,
    initSession,
    processEvent,
    updatePhase,
    reset: resetOrchestrator,
  } = useVibeOrchestrator();

  const [activeAgent, setActiveAgent] = useState<AgentStatus | null>(null);
  const [workingSteps, setWorkingSteps] = useState<WorkingStep[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [vibeMode, setVibeMode] = useState<VibeMode>('build');

  const messageIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<AgentMessage[]>([]);
  const workingStepsMapRef = useRef<Map<string, WorkingStep>>(new Map());

  // Keyboard shortcuts
  const { shortcuts } = useVibeKeyboardShortcuts({
    onSaveFile: () => {
      toast.info('Save functionality coming soon');
    },
    onRefreshPreview: () => {
      setPreviewKey((prev) => prev + 1);
      toast.success('Preview refreshed');
    },
    onNewFile: () => {
      toast.info('New file functionality coming soon');
    },
    onShowShortcuts: () => {
      setShortcutsDialogOpen(true);
    },
  });

  const mapRowToMessage = useCallback((row: VibeMessageRow): AgentMessage => {
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      agentName: row.employee_name || undefined,
      agentRole: row.employee_role || undefined,
      timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
      isStreaming: getMessageIsStreaming(row.metadata),
    };
  }, []);

  const upsertMessage = useCallback((message: AgentMessage) => {
    messageIdsRef.current.add(message.id);
    setMessages((prev) => {
      const index = prev.findIndex((item) => item.id === message.id);
      if (index === -1) {
        const next = [...prev, message];
        next.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return next;
      }
      const next = [...prev];
      next[index] = message;
      return next;
    });
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const messages = await VibeMessageService.getMessages(sessionId);
      const mapped = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        agentName: msg.employee_name || undefined,
        agentRole: msg.employee_role || undefined,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        isStreaming: Boolean(msg.is_streaming),
      }));
      messageIdsRef.current = new Set(mapped.map((msg) => msg.id));
      setMessages(mapped);
    } catch (error) {
      console.error('[VIBE] Failed to load messages', error);
      toast.error('Failed to load VIBE history.');
    }
  }, []);

  const ensureSession = useCallback(async () => {
    if (currentSessionId) {
      return currentSessionId;
    }
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('vibe_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      let sessionId = data?.id;

      if (!sessionId) {
        const { data: inserted, error: insertError } = await supabase
          .from('vibe_sessions')
          .insert({ user_id: user.id, title: 'VIBE Session' })
          .select('id')
          .single();

        if (insertError) throw insertError;
        sessionId = inserted.id;
      }

      setCurrentSession(sessionId);
      await loadMessages(sessionId);
      return sessionId;
    } catch (error) {
      console.error('[VIBE] Failed to initialize session', error);
      toast.error('Unable to initialize VIBE session.');
      return null;
    }
  }, [currentSessionId, loadMessages, setCurrentSession, user]);

  const streamAssistantResponse = useCallback(
    async (messageId: string, fullContent: string) => {
      const chunks = fullContent.split(/(\s+)/).filter((part) => part.length);
      for (const chunk of chunks) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  content: `${message.content || ''}${chunk}`,
                }
              : message
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, isStreaming: false }
            : message
        )
      );
    },
    []
  );

  const handleAgentAction = useCallback(
    (action: VibeAgentActionRow) => {
      const status: WorkingStep['status'] =
        action.status === 'failed'
          ? 'failed'
          : action.status === 'completed'
            ? 'completed'
            : 'in_progress';

      // Use type guards to safely extract metadata and result
      const actionMetadata = getValidatedActionMetadata(action.metadata);
      const actionResult = getValidatedActionResult(action.result);

      const description =
        actionMetadata.summary ||
        actionMetadata.description ||
        actionMetadata.command ||
        `${action.agent_name} ${action.action_type.replace(/_/g, ' ')}`;

      workingStepsMapRef.current.set(action.id, {
        id: action.id,
        description,
        status,
        timestamp: action.timestamp ? new Date(action.timestamp) : undefined,
        result:
          actionResult.output ||
          actionResult.summary ||
          action.error ||
          undefined,
      });

      const ordered = Array.from(workingStepsMapRef.current.values()).sort(
        (a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      );
      setWorkingSteps(ordered);

      setActiveAgent((prev) => ({
        name: action.agent_name,
        role:
          actionMetadata.agent_role ||
          prev?.role ||
          hiredEmployees?.find((emp) => emp.name === action.agent_name)?.role ||
          'AI Agent',
        status:
          status === 'failed'
            ? 'error'
            : status === 'completed'
              ? 'completed'
              : 'working',
        currentTask: description,
      }));
    },
    [hiredEmployees]
  );

  useVibeRealtime({
    sessionId: currentSessionId || null,
    onAction: handleAgentAction,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/vibe' } });
      return;
    }

    if (!hiredEmployees || hiredEmployees.length === 0) {
      navigate('/workforce', {
        state: {
          message:
            'Please hire at least one AI employee to use the VIBE workspace.',
        },
      });
      return;
    }

    ensureSession();
  }, [ensureSession, hiredEmployees, navigate, user]);

  useEffect(() => {
    if (hiredEmployees?.length && !activeAgent) {
      setActiveAgent({
        name: hiredEmployees[0].name || 'AI Specialist',
        role: hiredEmployees[0].role || 'Engineer',
        status: 'idle',
      });
    }
  }, [activeAgent, hiredEmployees]);

  useEffect(() => {
    // Defensive: Ensure sessionId is valid before creating channel
    const sessionId = currentSessionId;
    if (!sessionId || typeof sessionId !== 'string') return;

    const channel = supabase
      .channel(`vibe-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!payload.new) return;
          const row = payload.new as VibeMessageRow;
          const message = mapRowToMessage(row);
          upsertMessage(message);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[VIBE] Failed to subscribe to message updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId, mapRowToMessage, upsertMessage]);

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim()) return;
      if (!user) {
        toast.error('You must be logged in to send messages.');
        return;
      }

      // Defensive: Ensure we have a valid sessionId
      const sessionId = currentSessionId || (await ensureSession());
      if (!sessionId || typeof sessionId !== 'string') {
        toast.error('Unable to send message: Invalid session.');
        return;
      }

      setIsLoading(true);
      workingStepsMapRef.current.clear();
      setWorkingSteps([
        {
          id: 'analyze',
          description: 'Analyzing request…',
          status: 'in_progress',
          timestamp: new Date(),
        },
        {
          id: 'plan',
          description: 'Planning multi-agent workflow',
          status: 'pending',
        },
        {
          id: 'execute',
          description: 'Executing plan',
          status: 'pending',
        },
      ]);

      // Initialize phase orchestrator (VibeSDK pattern)
      if (!orchestratorSession) {
        initSession('phasic');
      }
      processEvent({ type: 'connection_established', sessionId });
      processEvent({ type: 'blueprint_generating' });

      try {
        // Create user message locally first
        const userMessage: AgentMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        upsertMessage(userMessage);

        // Create user message in database
        await VibeMessageService.createMessage({
          sessionId,
          userId: user.id,
          role: 'user',
          content,
          metadata: {
            files: files?.map((file) => file.name) || [],
          },
        });

        // Call workforce orchestrator
        const orchestratorResponse =
          await workforceOrchestratorRefactored.processRequest({
            userId: user.id,
            input: content,
            mode: 'chat',
            sessionId,
            conversationHistory: [...messagesRef.current, userMessage].map(
              (message) => ({
                role: message.role,
                content: message.content,
              })
            ),
          });

        if (
          !orchestratorResponse.success ||
          !orchestratorResponse.chatResponse
        ) {
          throw new Error(
            orchestratorResponse.error || 'No response generated by workforce.'
          );
        }

        setWorkingSteps((prev) =>
          prev.map((step, index) =>
            index <= 1 ? { ...step, status: 'completed' } : step
          )
        );

        // Update phase orchestrator - blueprint complete, start implementation
        processEvent({ type: 'generation_started' });

        // Create streaming assistant message
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: AgentMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          agentName:
            orchestratorResponse.assignedEmployee ||
            activeAgent?.name ||
            hiredEmployees?.[0]?.name ||
            'AI Assistant',
          agentRole:
            activeAgent?.role || hiredEmployees?.[0]?.role || 'Specialist',
          isStreaming: true,
        };

        upsertMessage(assistantMessage);

        // Stream response to UI
        await streamAssistantResponse(
          assistantMessageId,
          orchestratorResponse.chatResponse
        );

        // Process AI response for code files
        try {
          const parseResult = await vibeMessageHandler.handleAIResponse(
            orchestratorResponse.chatResponse,
            sessionId
          );

          if (parseResult.filesCreated > 0) {
            // Emit file generation events to phase orchestrator
            for (const file of parseResult.files) {
              processEvent({
                type: 'file_generated',
                filePath: file.path,
                content: file.content,
              });
            }

            // If project structure detected, show info
            if (parseResult.projectInfo.type !== 'unknown') {
              toast.success(
                `Detected ${parseResult.projectInfo.type} project with ${parseResult.filesCreated} files`
              );
            }
          }

          // Mark generation complete
          processEvent({ type: 'generation_complete' });
        } catch (parseError) {
          console.error(
            '[VIBE] Failed to parse code from response:',
            parseError
          );
          // Don't fail the whole message if parsing fails
        }

        // Save final assistant message to database
        await VibeMessageService.createMessage({
          sessionId,
          userId: user.id,
          role: 'assistant',
          content: orchestratorResponse.chatResponse,
          employeeName: assistantMessage.agentName,
          employeeRole: assistantMessage.agentRole,
          isStreaming: false,
        });

        setWorkingSteps((prev) =>
          prev.map((step) =>
            step.id === 'execute'
              ? { ...step, status: 'completed', timestamp: new Date() }
              : step
          )
        );
      } catch (error) {
        console.error('[VIBE] Failed to send message', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to send message'
        );
        setWorkingSteps((prev) =>
          prev.map((step) =>
            step.status === 'in_progress' ? { ...step, status: 'failed' } : step
          )
        );
        if (activeAgent) {
          setActiveAgent({ ...activeAgent, status: 'error' });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeAgent,
      currentSessionId,
      ensureSession,
      hiredEmployees,
      initSession,
      orchestratorSession,
      processEvent,
      streamAssistantResponse,
      upsertMessage,
      user,
    ]
  );

  if (!user || !hiredEmployees) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hiredEmployees.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary fallback={<VibeErrorFallback />}>
      <VibeLayout>
        <div className="flex h-full flex-col">
          {/* Header with Phase Timeline */}
          <div className="border-b border-border bg-gradient-to-r from-purple-600/10 to-blue-600/10 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h1 className="text-lg font-bold">Vibe</h1>
                </div>
                {/* Compact Phase Timeline - VibeSDK-inspired */}
                <div className="hidden sm:block">
                  <PhaseTimeline
                    session={orchestratorSession}
                    compact={true}
                    className="ml-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TokenUsageDisplay sessionId={currentSessionId} />
              </div>
            </div>
          </div>

          {/* Main Content - 3 Panel Layout */}
          <div className="flex-1 overflow-hidden">
            {/* Desktop Layout: Horizontal split */}
            <div className="hidden h-full md:block">
              <PanelGroup direction="horizontal">
                {/* Left Panel - Chat (30%) */}
                <Panel defaultSize={30} minSize={25} maxSize={40}>
                  <SimpleChatPanel
                    messages={messages}
                    isLoading={isLoading}
                    onPromptSelect={handleSendMessage}
                    showEmptyState={messages.length === 0}
                  />
                </Panel>

                <PanelResizeHandle className="group relative w-1 bg-border transition-colors hover:bg-primary">
                  <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-sm border border-border bg-background p-1 shadow-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </PanelResizeHandle>

                {/* Right Panel - Code + Preview (70%) */}
                <Panel defaultSize={70} minSize={60}>
                  <PanelGroup direction="vertical">
                    {/* Code Editor (60%) */}
                    <Panel defaultSize={60} minSize={40} maxSize={80}>
                      <CodeEditorPanel />
                    </Panel>

                    <PanelResizeHandle className="group relative h-1 bg-border transition-colors hover:bg-primary">
                      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-sm border border-border bg-background px-1 py-0.5 shadow-lg">
                          <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground" />
                        </div>
                      </div>
                    </PanelResizeHandle>

                    {/* Live Preview (40%) */}
                    <Panel defaultSize={40} minSize={20} maxSize={60}>
                      <LivePreviewPanel key={previewKey} />
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            </div>

            {/* Mobile Layout: Vertical stack */}
            <div className="flex h-full flex-col md:hidden">
              {/* Chat */}
              <div className="flex-1 overflow-hidden border-b border-border">
                <SimpleChatPanel
                  messages={messages}
                  isLoading={isLoading}
                  onPromptSelect={handleSendMessage}
                  showEmptyState={messages.length === 0}
                />
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden border-b border-border">
                <CodeEditorPanel />
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-hidden">
                <LivePreviewPanel key={previewKey} />
              </div>
            </div>
          </div>

          {/* Enhanced Message Composer - Fixed at bottom */}
          <VibeEnhancedComposer
            onSend={handleSendMessage}
            isLoading={isLoading}
            mode={vibeMode}
            onModeChange={setVibeMode}
            showModeToggle={messages.length > 0}
            showQuickActions={messages.length > 0}
          />
        </div>

        {/* Keyboard Shortcuts Dialog */}
        <VibeKeyboardShortcutsDialog
          open={shortcutsDialogOpen}
          onOpenChange={setShortcutsDialogOpen}
          shortcuts={shortcuts}
        />
      </VibeLayout>
    </ErrorBoundary>
  );
};

export default VibeDashboard;
