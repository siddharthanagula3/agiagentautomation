import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useWorkforceStore } from '@shared/stores/employee-management-store';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { useVibeViewStore } from '../stores/vibe-view-store';
import { VibeLayout } from '../layouts/VibeLayout';
import { VibeSplitView } from '../layouts/VibeSplitView';
import { AgentPanel } from '../components/agent-panel/AgentPanel';
import { VibeMessageInput } from '../components/input/VibeMessageInput';
import { ViewSelector } from '../components/output-panel/ViewSelector';
import { EditorView } from '../components/output-panel/EditorView';
import { AppViewerView } from '../components/output-panel/AppViewerView';
import { Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';

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
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown> | null;
  is_streaming?: boolean | null;
}

const OutputPanel = () => {
  const { activeView } = useVibeViewStore();

  return (
    <div className="flex h-full flex-col bg-background">
      <ViewSelector />
      <div className="flex-1 overflow-hidden">
        {activeView === 'editor' && <EditorView />}
        {activeView === 'app-viewer' && <AppViewerView />}
      </div>
    </div>
  );
};

const VibeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hiredEmployees } = useWorkforceStore();
  const { currentSessionId, setCurrentSession } = useVibeChatStore();

  const [activeAgent, setActiveAgent] = useState<AgentStatus | null>(null);
  const [workingSteps, setWorkingSteps] = useState<WorkingStep[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messageIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<AgentMessage[]>([]);
  const workingStepsMapRef = useRef<Map<string, WorkingStep>>(new Map());

  const mapRowToMessage = useCallback((row: VibeMessageRow): AgentMessage => {
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      agentName: row.employee_name || undefined,
      agentRole: row.employee_role || undefined,
      timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
      isStreaming: Boolean(row.metadata?.is_streaming),
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

      const description =
        action.metadata?.summary ||
        action.metadata?.description ||
        action.metadata?.command ||
        `${action.agent_name} ${action.action_type.replace(/_/g, ' ')}`;

      workingStepsMapRef.current.set(action.id, {
        id: action.id,
        description,
        status,
        timestamp: action.timestamp ? new Date(action.timestamp) : undefined,
        result:
          action.result?.output ||
          action.result?.summary ||
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
          action.metadata?.agent_role ||
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
    <VibeLayout>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-hidden">
          <VibeSplitView>
            <AgentPanel
              agent={activeAgent}
              workingSteps={workingSteps}
              messages={messages}
            />
            <OutputPanel />
          </VibeSplitView>
        </div>

        <VibeMessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </VibeLayout>
  );
};

export default VibeDashboard;
