/**
 * MultiAgentChatPage - Example implementation
 *
 * This is an example page showing how to use the MultiAgentChatInterface
 * with the mission control store integration.
 *
 * To use this page:
 * 1. Rename to MultiAgentChatPage.tsx
 * 2. Add route in App.tsx
 * 3. Customize callbacks for your use case
 */

import React, { useState, useEffect } from 'react';
import { MultiAgentChatInterface } from '@features/chat/components/MultiAgentChatInterface';
import { useMissionStore } from '@shared/stores/mission-control-store';
import { workforceOrchestrator } from '@core/ai/orchestration/workforce-orchestrator';
import { toast } from 'sonner';

export default function MultiAgentChatPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Mission store state
  const missionStatus = useMissionStore(state => state.missionStatus);
  const addMessage = useMissionStore(state => state.addMessage);

  // Handle sending messages
  const handleSendMessage = async (content: string, mentions?: string[]) => {
    try {
      // Add user message to store
      addMessage({
        from: 'user',
        type: 'user',
        content,
        metadata: mentions?.length ? { mentions } : undefined,
      });

      // If message mentions specific agents, route to them
      if (mentions && mentions.length > 0 && selectedAgent) {
        // Direct message to specific agent
        console.log(`Sending to ${selectedAgent}:`, content);
        // TODO: Implement direct agent messaging
        toast.info(`Message sent to ${selectedAgent}`);
      } else {
        // Send to workforce orchestrator for general processing
        console.log('Sending to orchestrator:', content);
        await workforceOrchestrator.executeUserRequest(content);
        toast.success('Request sent to AI workforce');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      addMessage({
        from: 'system',
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    toast.info(`Selected agent: ${agentId}`);
    console.log('Selected agent:', agentId);
  };

  // Handle fullscreen toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Page Header (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-2xl font-bold">Multi-Agent Chat</h1>
          <p className="text-sm text-muted-foreground">
            Collaborate with AI agents in real-time
          </p>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <MultiAgentChatInterface
          onSendMessage={handleSendMessage}
          onAgentSelect={handleAgentSelect}
          showTaskView={true}
          showParticipants={true}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      {/* Status Bar (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="border-t border-border bg-card px-6 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Status:{' '}
                <span className="font-medium">
                  {missionStatus === 'idle' && 'Ready'}
                  {missionStatus === 'planning' && 'Planning...'}
                  {missionStatus === 'executing' && 'Executing...'}
                  {missionStatus === 'completed' && 'Completed'}
                  {missionStatus === 'failed' && 'Failed'}
                </span>
              </span>
              {selectedAgent && (
                <span>
                  Direct messaging: <span className="font-medium">{selectedAgent}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
                Ctrl+F
              </kbd>
              <span>Fullscreen</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Add to App.tsx routes:
 * ```tsx
 * import MultiAgentChatPage from '@features/chat/pages/MultiAgentChatPage';
 *
 * <Route path="/multi-agent-chat" element={<MultiAgentChatPage />} />
 * ```
 *
 * 2. Use individual components:
 * ```tsx
 * import { AdvancedMessageList } from '@features/chat/components/AdvancedMessageList';
 * import { EnhancedMessageInput } from '@features/chat/components/EnhancedMessageInput';
 *
 * function CustomChat() {
 *   return (
 *     <div className="flex h-screen flex-col">
 *       <AdvancedMessageList messages={messages} agents={agents} />
 *       <EnhancedMessageInput agents={agents} onSend={handleSend} />
 *     </div>
 *   );
 * }
 * ```
 *
 * 3. Integrate with existing Mission Control:
 * ```tsx
 * import { MultiAgentChatInterface } from '@features/chat/components/MultiAgentChatInterface';
 * import { MissionControlDashboard } from '@features/mission-control/pages/MissionControlDashboard';
 *
 * function EnhancedMissionControl() {
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <MultiAgentChatInterface showTaskView={false} />
 *       <MissionControlDashboard />
 *     </div>
 *   );
 * }
 * ```
 */
