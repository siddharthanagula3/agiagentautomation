/**
 * Mission Control Page
 * AI Workforce Mission Control - Deploy and monitor AI employees in real-time
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import {
  Play,
  Pause,
  StopCircle,
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import {
  useCompanyHubStore,
  useOrchestrationStatus,
} from '@shared/stores/company-hub-store';
import { companyHubOrchestrator } from '@_core/orchestration/company-hub-orchestrator';
import { AgentStatusPanel } from '../components/AgentStatusPanel';
import { MissionLog } from '../components/MissionLog';

const MissionControlPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const {
    createSession,
    startOrchestration,
    pauseOrchestration,
    resumeOrchestration,
    stopOrchestration,
    updateAgentStatus,
    addMessage,
    addUpsellRequest,
    resolveUpsell,
    addTokens,
    assignAgent,
    reset,
  } = useCompanyHubStore();

  const { isOrchestrating, isPaused, error } = useOrchestrationStatus();

  const [taskInput, setTaskInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const upsellResolvers = useRef<Map<string, (approved: boolean) => void>>(
    new Map()
  );

  // Get task from navigation state (if coming from /chat)
  useEffect(() => {
    const state = location.state as { taskDescription?: string };
    if (state?.taskDescription) {
      setTaskInput(state.taskDescription);
    }
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!hasStarted) {
        reset();
      }
    };
  }, [hasStarted, reset]);

  const handleStartTask = async () => {
    if (!taskInput.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to continue');
      navigate('/auth/login');
      return;
    }

    setHasStarted(true);

    // Create session
    const sessionId = createSession(user.id, taskInput);

    // Add initial message
    addMessage({
      sessionId,
      from: 'user',
      type: 'user',
      content: taskInput,
    });

    // Start orchestration
    startOrchestration();

    try {
      // Use mock execution for now (replace with real execution when ready)
      await companyHubOrchestrator.mockExecute({
        userId: user.id,
        sessionId,
        taskDescription: taskInput,
        onStatusUpdate: (agentId, status) => {
          updateAgentStatus(agentId, status);

          // Assign agent if not already assigned
          if (status.status !== 'idle') {
            assignAgent({
              agentId,
              agentName: status.agentName,
              role: status.agentName,
              provider: 'claude',
              status: status.status,
              currentTask: status.currentTask,
              progress: status.progress,
              toolsUsing: status.toolsUsing,
              output:
                typeof status.output === 'string' ? status.output : undefined,
            });
          }
        },
        onMessage: (message) => {
          addMessage(message);
        },
        onUpsellRequest: async (request) => {
          return new Promise<boolean>((resolve) => {
            const requestId = crypto.randomUUID();
            upsellResolvers.current.set(requestId, resolve);

            addUpsellRequest({
              ...request,
            });

            // Wait for resolution (handled by UpsellModal)
            // The modal will call resolveUpsell which will trigger the resolver
          });
        },
        onTokenUpdate: (model, tokens, cost, provider) => {
          addTokens(model, tokens, cost, provider);
        },
      });

      stopOrchestration();
      toast.success('Task completed successfully!');
    } catch (err) {
      console.error('Orchestration error:', err);
      toast.error('An error occurred during execution');
      stopOrchestration();
    }
  };

  const handlePause = () => {
    pauseOrchestration();
    toast.info('Orchestration paused');
  };

  const handleResume = () => {
    resumeOrchestration();
    toast.success('Orchestration resumed');
  };

  const handleStop = () => {
    stopOrchestration();
    toast.info('Orchestration stopped');
  };

  const handleReset = () => {
    reset();
    setTaskInput('');
    setHasStarted(false);
    toast.success('Hub reset');
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                <Sparkles className="h-6 w-6 text-primary" />
                Mission Control
              </h1>
              <p className="mt-1 text-slate-400">AI Workforce Command Center</p>
            </div>
          </div>

          {/* Control Buttons */}
          {hasStarted && (
            <div className="flex gap-2">
              {!isOrchestrating ? (
                <Button variant="outline" onClick={handleReset}>
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
                <>
                  <Button variant="outline" onClick={handlePause}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button variant="outline" onClick={handleStop}>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Task Input (if not started) */}
      {!hasStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              What would you like your AI team to build?
            </h2>
            <Textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Describe your task in detail... (e.g., Build a landing page with contact form, API integration, and analytics dashboard)"
              className="mb-4 min-h-[120px] resize-none"
            />
            <Button
              onClick={handleStartTask}
              disabled={!taskInput.trim() || isOrchestrating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isOrchestrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Building
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Hub Interface (when started) */}
      {hasStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_1fr]"
        >
          {/* Left Sidebar: Agent Status */}
          <div className="flex min-h-0 flex-col gap-4">
            <AgentStatusPanel />
          </div>

          {/* Main Mission Log Area */}
          <div className="min-h-0">
            <MissionLog />
          </div>
        </motion.div>
      )}

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

export default MissionControlPage;
