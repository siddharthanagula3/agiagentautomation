/**
 * VibeDashboard - MGX-Inspired Multi-Agent Workspace
 *
 * Features:
 * - Standalone layout (no main sidebar)
 * - Split view (agent panel + output views)
 * - Real-time agent work visualization
 * - Multi-view system (Chat/Editor/Planner/App Viewer/Terminal/File Tree)
 */

import React, { useEffect, useState } from 'react';
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
import { PlannerView } from '../components/output-panel/PlannerView';
import { AppViewerView } from '../components/output-panel/AppViewerView';
import { TerminalView } from '../components/output-panel/TerminalView';
import { FileTreeView } from '../components/output-panel/FileTreeView';
import { AgentMessageList } from '../components/agent-panel/AgentMessageList';
import { Loader2 } from 'lucide-react';
import type { AgentStatus } from '../components/agent-panel/AgentStatusCard';
import type { WorkingStep } from '../components/agent-panel/WorkingProcessSection';
import type { AgentMessage } from '../components/agent-panel/AgentMessageList';

// Output Panel with View Switching
const OutputPanel = ({ messages }: { messages: AgentMessage[] }) => {
  const { activeView } = useVibeViewStore();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* View Selector Tabs */}
      <ViewSelector />

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && (
          <div className="h-full">
            <AgentMessageList messages={messages} />
          </div>
        )}
        {activeView === 'editor' && <EditorView />}
        {activeView === 'planner' && <PlannerView />}
        {activeView === 'app-viewer' && <AppViewerView />}
        {activeView === 'terminal' && <TerminalView />}
        {activeView === 'file-tree' && <FileTreeView />}
      </div>
    </div>
  );
};

const VibeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hiredEmployees } = useWorkforceStore();
  const { currentSessionId, createNewSession, addMessage } = useVibeChatStore();

  // Mock state for demonstration
  const [activeAgent, setActiveAgent] = useState<AgentStatus | null>(null);
  const [workingSteps, setWorkingSteps] = useState<WorkingStep[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', {
        state: { from: '/vibe' },
      });
      return;
    }

    // Check if user has hired employees
    if (!hiredEmployees || hiredEmployees.length === 0) {
      navigate('/workforce', {
        state: {
          message: 'Please hire at least one AI employee to use the VIBE workspace.',
        },
      });
      return;
    }

    // Create a new session if none exists
    if (!currentSessionId) {
      createNewSession('New VIBE Session');
    }

    // Set up mock agent for demonstration
    if (hiredEmployees.length > 0 && !activeAgent) {
      setActiveAgent({
        name: hiredEmployees[0].name || 'AI Assistant',
        role: hiredEmployees[0].role || 'Engineer',
        status: 'idle',
        currentTask: undefined,
      });
    }
  }, [user, hiredEmployees, currentSessionId, createNewSession, navigate, activeAgent]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add to store
    addMessage({
      role: 'user',
      content,
      session_id: currentSessionId!,
      user_id: user!.id,
    });

    // Simulate agent response
    setIsLoading(true);

    // Update agent status to working
    if (activeAgent) {
      setActiveAgent({
        ...activeAgent,
        status: 'working',
        currentTask: content,
      });
    }

    // Simulate working steps
    const mockSteps: WorkingStep[] = [
      {
        id: '1',
        description: 'Analyzing your request...',
        status: 'in_progress',
        timestamp: new Date(),
      },
      {
        id: '2',
        description: 'Planning implementation steps',
        status: 'pending',
      },
      {
        id: '3',
        description: 'Executing tasks',
        status: 'pending',
      },
    ];
    setWorkingSteps(mockSteps);

    // Simulate response delay
    setTimeout(() => {
      // Complete first step
      setWorkingSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
        }))
      );

      setTimeout(() => {
        // Complete second step
        setWorkingSteps((prev) =>
          prev.map((step, idx) => ({
            ...step,
            status: idx < 2 ? 'completed' : idx === 2 ? 'in_progress' : 'pending',
          }))
        );

        setTimeout(() => {
          // Complete all steps
          setWorkingSteps((prev) =>
            prev.map((step) => ({
              ...step,
              status: 'completed',
            }))
          );

          // Add agent response
          const assistantMessage: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I understand you want me to help with: "${content}"\n\nI've analyzed your request and I'm ready to assist. This is a demonstration of the VIBE interface. The full agent execution logic will be integrated in the next phase.\n\n**Next steps:**\n1. Connect to the workforce orchestrator\n2. Implement real agent execution\n3. Add streaming responses\n4. Enable multi-agent collaboration`,
            timestamp: new Date(),
            agentName: activeAgent?.name,
            agentRole: activeAgent?.role,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          addMessage({
            role: 'assistant',
            content: assistantMessage.content,
            session_id: currentSessionId!,
            user_id: user!.id,
          });

          // Update agent status back to idle
          if (activeAgent) {
            setActiveAgent({
              ...activeAgent,
              status: 'completed',
              currentTask: undefined,
            });
          }

          setIsLoading(false);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Loading state
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No employees state
  if (!hiredEmployees || hiredEmployees.length === 0) {
    return null;
  }

  return (
    <VibeLayout>
      <div className="h-full flex flex-col">
        {/* Split View - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <VibeSplitView>
            {/* Left Panel: Agent Process */}
            <AgentPanel
              agent={activeAgent}
              workingSteps={workingSteps}
              messages={messages}
            />

            {/* Right Panel: Output Views */}
            <OutputPanel messages={messages} />
          </VibeSplitView>
        </div>

        {/* Message Input - Fixed at bottom */}
        <VibeMessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </VibeLayout>
  );
};

export default VibeDashboard;
