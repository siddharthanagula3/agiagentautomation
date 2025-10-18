/**
 * Mission Control Page - REFACTORED
 * AI Workforce Command Center with resizable panels
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
import { Play, Pause, RotateCcw, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  useMissionStore,
  useMissionStatus,
} from '@shared/stores/mission-control-store';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import { AgentStatusPanel } from '../components/EmployeeStatusPanel';
import { MissionLogEnhanced } from '../components/ActivityLog';

const MissionControlPageRefactored: React.FC = () => {
  const { user } = useAuthStore();
  const { status, isOrchestrating, isPaused, error } = useMissionStatus();
  const { pauseMission, resumeMission, reset } = useMissionStore();

  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      toast.error('Please enter a mission objective');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await workforceOrchestratorRefactored.processRequest({
        userId: user.id,
        input: userInput.trim(),
      });

      if (response.success) {
        toast.success('Mission started successfully!');
        setUserInput(''); // Clear input after successful submission
      } else {
        toast.error(response.error || 'Failed to start mission');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to start mission: ${errorMessage}`);
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
            <p className="mt-1 text-slate-400">AI Workforce Command Center</p>
          </div>

          {/* Control Buttons */}
          {status !== 'idle' && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>
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
                <label className="text-sm font-medium text-foreground">
                  Mission Objective
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your mission objective... (e.g., 'Review the codebase and identify potential bugs')"
                  className="min-h-[100px] resize-none"
                  disabled={isOrchestrating && !isPaused}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {isOrchestrating
                      ? isPaused
                        ? 'Mission paused'
                        : 'Mission in progress...'
                      : 'Press Cmd/Ctrl + Enter to send'}
                  </p>
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
                        Starting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Deploy Workforce
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
