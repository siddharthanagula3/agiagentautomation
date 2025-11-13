/**
 * Mission Control Page - REFACTORED
 * AI Workforce Command Center with resizable panels
 * Now supports both Mission Mode and Multi-Agent Chat Mode
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@shared/ui/resizable';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Send,
  MessageSquare,
  Layers,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  useMissionStore,
  useMissionStatus,
} from '@shared/stores/mission-control-store';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import { AgentStatusPanel } from '../components/EmployeeStatusPanel';
import { MissionLogEnhanced } from '../components/ActivityLog';
import { useMultiAgentChat } from '@features/chat/hooks/use-multi-agent-chat';
import { useAgentCollaboration } from '@features/chat/hooks/use-agent-collaboration';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@shared/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';

const MissionControlPageRefactored: React.FC = () => {
  const { user } = useAuthStore();
  const { status, isOrchestrating, isPaused, error } = useMissionStatus();
  const { pauseMission, resumeMission, reset, mode, setMode } = useMissionStore();

  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMode, setCurrentMode] = useState<'mission' | 'chat'>('mission');

  // Multi-agent chat integration
  const multiAgentChat = useMultiAgentChat({
    mode: currentMode,
    userId: user?.id,
    autoSelectAgent: true,
  });

  const agentCollaboration = useAgentCollaboration({
    userId: user?.id,
    maxConcurrentAgents: 5,
  });

  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      toast.error(
        currentMode === 'mission'
          ? 'Please enter a mission objective'
          : 'Please enter a message'
      );
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentMode === 'chat') {
        // Use multi-agent chat hook
        await multiAgentChat.sendMessage(userInput.trim());
      } else {
        // Use traditional mission orchestration
        const response = await workforceOrchestratorRefactored.processRequest({
          userId: user.id,
          input: userInput.trim(),
          mode: 'mission',
        });

        if (response.success) {
          toast.success('Mission started successfully!');
        } else {
          toast.error(response.error || 'Failed to start mission');
        }
      }

      setUserInput(''); // Clear input after successful submission
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        currentMode === 'mission'
          ? `Failed to start mission: ${errorMessage}`
          : `Failed to send message: ${errorMessage}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = () => {
    pauseMission();
    toast.info('Mission paused');
  };

  const handleResume = () => {
    resumeMission();
    toast.success('Mission resumed');
  };

  const handleReset = () => {
    reset();
    setUserInput('');
    toast.success('Mission control reset');
  };

  const handleModeSwitch = (newMode: 'mission' | 'chat') => {
    setCurrentMode(newMode);
    setMode(newMode);
    multiAgentChat.switchMode(newMode);
    toast.info(
      newMode === 'mission'
        ? 'Switched to Mission Mode - Full orchestration with task breakdown'
        : 'Switched to Chat Mode - Conversational multi-agent interaction'
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
              <Sparkles className="h-7 w-7 text-primary" />
              Mission Control
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-slate-400">AI Workforce Command Center</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                {currentMode === 'mission' ? (
                  <>
                    <Layers className="h-3 w-3" />
                    <span>Mission Mode</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3 w-3" />
                    <span>Chat Mode</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {/* Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleModeSwitch(currentMode === 'mission' ? 'chat' : 'mission')
                    }
                    disabled={isOrchestrating && !isPaused}
                  >
                    {currentMode === 'mission' ? (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Switch to Chat
                      </>
                    ) : (
                      <>
                        <Layers className="mr-2 h-4 w-4" />
                        Switch to Mission
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    {currentMode === 'mission'
                      ? 'Chat Mode: Conversational multi-agent interaction'
                      : 'Mission Mode: Full task breakdown and orchestration'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Orchestration Controls */}
            {status !== 'idle' && (
              <>
                {status === 'completed' || status === 'failed' ? (
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                ) : isPaused ? (
                  <Button
                    onClick={handleResume}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handlePause}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mode Description */}
        {currentMode === 'chat' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-300">Chat Mode Active</p>
              <p className="text-blue-400/80 text-xs mt-1">
                Messages are routed to the most appropriate agent based on context.
                Perfect for conversational workflows and quick tasks.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Content - Resizable Panels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 rounded-lg border border-border"
        >
          {/* Left Panel: Workforce Status */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full p-4">
              <AgentStatusPanel />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: Mission Log + Input */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="flex h-full flex-col p-4">
              {/* Mission Log */}
              <div className="mb-4 flex-1 overflow-hidden">
                <MissionLogEnhanced />
              </div>

              {/* Input Area */}
              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {currentMode === 'mission' ? 'Mission Objective' : 'Message'}
                  </label>
                  {currentMode === 'chat' && agentCollaboration.selectedAgents.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {agentCollaboration.selectedAgents.length} agent(s) selected
                    </span>
                  )}
                </div>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentMode === 'mission'
                      ? "Describe your mission objective... (e.g., 'Review the codebase and identify potential bugs')"
                      : "Type your message... (e.g., 'Analyze this code for bugs')"
                  }
                  className="min-h-[100px] resize-none"
                  disabled={isOrchestrating && !isPaused}
                />
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">
                      {isOrchestrating
                        ? isPaused
                          ? currentMode === 'mission'
                            ? 'Mission paused'
                            : 'Chat paused'
                          : currentMode === 'mission'
                            ? 'Mission in progress...'
                            : 'Agent processing...'
                        : 'Press Cmd/Ctrl + Enter to send'}
                    </p>
                    {currentMode === 'chat' && multiAgentChat.activeAgents.length > 0 && (
                      <p className="text-xs text-green-400">
                        Active: {multiAgentChat.activeAgents.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      isSubmitting ||
                      (isOrchestrating && !isPaused) ||
                      !userInput.trim()
                    }
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        {currentMode === 'mission' ? 'Starting...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {currentMode === 'mission' ? 'Deploy Workforce' : 'Send Message'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

export default MissionControlPageRefactored;
