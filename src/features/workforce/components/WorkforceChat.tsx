/**
 * WorkforceChat - Main interface for interacting with AI Workforce
 * Provides natural language input and real-time execution monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Pause,
  Play,
  X,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  executeWorkforce,
  pauseWorkforce,
  resumeWorkforce,
  cancelWorkforce,
  rollbackWorkforce,
  previewExecution,
  type WorkforceResponse,
  type ExecutionUpdate,
} from '@_core/orchestration/workforce-orchestrator';
import {
  Task,
  TaskStatus,
} from '@_core/orchestration/reasoning/task-decomposer';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';

interface WorkforceChatProps {
  userId: string;
  className?: string;
  onComplete?: (result: unknown) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'update' | 'error' | 'success';
  content: string;
  timestamp: Date;
  data?: unknown;
}

interface ExecutionState {
  id: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  tasks: Task[];
  currentTask?: Task;
  completedTasks: number;
  failedTasks: number;
  progress: number;
}

export const WorkforceChat: React.FC<WorkforceChatProps> = ({
  userId,
  className = '',
  onComplete,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<unknown>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add message to chat
  const addMessage = (
    type: ChatMessage['type'],
    content: string,
    data?: ChatMessage['data']
  ) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      type,
      content,
      timestamp: new Date(),
      data,
    };
    setMessages((prev) => [...prev, message]);
  };

  // Handle preview
  const handlePreview = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    addMessage('system', 'Analyzing your request...');

    try {
      const previewResult = await previewExecution(userId, input);
      setPreview(previewResult);
      setShowPreview(true);

      addMessage(
        'system',
        `Preview: ${previewResult.plan.tasks.length} tasks, ~${previewResult.estimatedTime} minutes, ~$${(previewResult.estimatedCost / 100).toFixed(2)}`
      );
    } catch (error) {
      addMessage('error', `Preview failed: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle execution
  const handleExecute = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setShowPreview(false);

    addMessage('user', input);
    addMessage('system', '🚀 Starting AI Workforce...');

    try {
      const response: WorkforceResponse = await executeWorkforce(userId, input);

      if (!response.success) {
        addMessage('error', response.error || 'Execution failed');
        setIsProcessing(false);
        return;
      }

      // Initialize execution state
      if (response.plan) {
        setExecutionState({
          id: response.executionId!,
          status: 'running',
          tasks: response.plan.tasks,
          completedTasks: 0,
          failedTasks: 0,
          progress: 0,
        });
      }

      // Clear input
      setInput('');

      // Stream updates
      if (response.updates) {
        for await (const update of response.updates) {
          handleExecutionUpdate(update);
        }
      }
    } catch (error) {
      addMessage('error', `Execution failed: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle execution updates
  const handleExecutionUpdate = (update: ExecutionUpdate) => {
    switch (update.type) {
      case 'status':
        addMessage('system', `📊 ${update.data.message}`);

        if (executionState) {
          setExecutionState((prev) => ({
            ...prev!,
            status: update.data.status,
          }));
        }

        if (update.data.status === 'completed') {
          addMessage('success', '🎉 All tasks completed successfully!');
          setExecutionState(null);
          onComplete?.(update.data);
        } else if (update.data.status === 'failed') {
          addMessage('error', `❌ Execution failed: ${update.data.message}`);
          setExecutionState(null);
        }
        break;

      case 'task_start':
        addMessage(
          'system',
          `⚡ Starting: ${update.data.title} (${update.data.agent})`
        );

        if (executionState) {
          const currentTask = executionState.tasks.find(
            (t) => t.id === update.data.task
          );
          setExecutionState((prev) => ({
            ...prev!,
            currentTask,
          }));
        }
        break;

      case 'task_complete':
        addMessage('success', `✅ Completed: ${update.data.title}`);

        if (executionState) {
          setExecutionState((prev) => {
            const completed = prev!.completedTasks + 1;
            const progress = (completed / prev!.tasks.length) * 100;

            return {
              ...prev!,
              completedTasks: completed,
              progress,
            };
          });
        }
        break;

      case 'task_error':
        addMessage(
          'error',
          `❌ Failed: ${update.data.title} - ${update.data.error}`
        );

        if (executionState) {
          setExecutionState((prev) => ({
            ...prev!,
            failedTasks: prev!.failedTasks + 1,
          }));
        }
        break;

      case 'agent_message':
        addMessage(
          'system',
          `🤖 ${update.data.agent}: ${JSON.stringify(update.data.message)}`
        );
        break;
    }
  };

  // Control functions
  const handlePause = () => {
    if (executionState) {
      pauseWorkforce(executionState.id);
      addMessage('system', '⏸️ Execution paused');
    }
  };

  const handleResume = async () => {
    if (executionState) {
      addMessage('system', '▶️ Resuming execution...');
      const updates = await resumeWorkforce(executionState.id);

      for await (const update of updates) {
        handleExecutionUpdate(update);
      }
    }
  };

  const handleCancel = () => {
    if (executionState) {
      cancelWorkforce(executionState.id);
      addMessage('system', '❌ Execution cancelled');
      setExecutionState(null);
    }
  };

  const handleRollback = async (taskId: string) => {
    if (executionState) {
      await rollbackWorkforce(executionState.id, taskId);
      addMessage('system', `🔄 Rolled back to task: ${taskId}`);
    }
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-700 p-4">
        <h2 className="text-xl font-semibold text-white">AI Workforce</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tell me what you need, and I'll coordinate the AI agents to get it
          done
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-slate-500">
                <svg
                  className="mx-auto mb-4 h-16 w-16 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">Ready to work!</p>
              <p className="mt-2 text-sm">
                Try: "Create a React component for user profile" or "Debug my
                API authentication"
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}

          {/* Execution State Card */}
          {executionState && (
            <ExecutionStateCard
              state={executionState}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onRollback={handleRollback}
            />
          )}

          {/* Preview Card */}
          {showPreview && preview && (
            <PreviewCard
              preview={preview}
              onExecute={() => {
                setShowPreview(false);
                handleExecute();
              }}
              onCancel={() => setShowPreview(false)}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && !e.shiftKey && handleExecute()
            }
            placeholder="What would you like me to do?"
            className="flex-1 border-slate-600 bg-slate-800 text-white"
            disabled={isProcessing || !!executionState}
          />

          <Button
            onClick={handlePreview}
            disabled={!input.trim() || isProcessing || !!executionState}
            variant="outline"
            className="border-slate-600"
          >
            <Clock className="mr-2 h-4 w-4" />
            Preview
          </Button>

          <Button
            onClick={handleExecute}
            disabled={!input.trim() || isProcessing || !!executionState}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Chat Message Component
const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({
  message,
}) => {
  const getIcon = () => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            U
          </div>
        );
      case 'system':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
            🤖
          </div>
        );
      case 'success':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-600/10 border-blue-600/20';
      case 'success':
        return 'bg-green-600/10 border-green-600/20';
      case 'error':
        return 'bg-red-600/10 border-red-600/20';
      default:
        return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${getBgColor()}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-white">{message.content}</p>
        <span className="mt-1 block text-xs text-slate-500">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// Execution State Card
const ExecutionStateCard: React.FC<{
  state: ExecutionState;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRollback: (taskId: string) => void;
}> = ({ state, onPause, onResume, onCancel, onRollback }) => {
  return (
    <Card className="border-slate-700 bg-slate-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Execution Progress</h3>
        <div className="flex gap-2">
          {state.status === 'running' && (
            <Button size="sm" variant="outline" onClick={onPause}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {state.status === 'paused' && (
            <Button size="sm" variant="outline" onClick={onResume}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {state.tasks.length}
            </div>
            <div className="text-xs text-slate-400">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {state.completedTasks}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">
              {state.failedTasks}
            </div>
            <div className="text-xs text-slate-400">Failed</div>
          </div>
        </div>

        {state.currentTask && (
          <div className="rounded-lg bg-slate-900/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm font-medium text-white">
                Current Task
              </span>
            </div>
            <p className="text-sm text-slate-300">{state.currentTask.title}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="text-xs">
                {state.currentTask.requiredAgent}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {state.currentTask.domain}
              </Badge>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400">Tasks</h4>
          <ScrollArea className="h-40">
            {state.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onRollback={() => onRollback(task.id)}
              />
            ))}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
};

// Task Item Component
const TaskItem: React.FC<{ task: Task; onRollback: () => void }> = ({
  task,
  onRollback,
}) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="group flex items-center gap-2 rounded p-2 transition-colors hover:bg-slate-700/50">
      {getStatusIcon()}
      <span className="flex-1 text-sm text-slate-300">{task.title}</span>
      {task.status === 'completed' && (
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRollback}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

// Preview Card Component
const PreviewCard: React.FC<{
  preview: unknown;
  onExecute: () => void;
  onCancel: () => void;
}> = ({ preview, onExecute, onCancel }) => {
  return (
    <Card className="border-blue-600/30 bg-blue-900/20 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">
        Execution Preview
      </h3>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {preview.plan.tasks.length}
          </div>
          <div className="text-xs text-slate-400">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {preview.estimatedTime}m
          </div>
          <div className="text-xs text-slate-400">Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            ${(preview.estimatedCost / 100).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400">Cost</div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <h4 className="text-sm font-medium text-slate-400">
          Tasks to Execute:
        </h4>
        {preview.plan.tasks.slice(0, 5).map((task: Task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 text-sm text-slate-300"
          >
            <span className="text-blue-400">•</span>
            {task.title}
          </div>
        ))}
        {preview.plan.tasks.length > 5 && (
          <div className="text-sm text-slate-500">
            ...and {preview.plan.tasks.length - 5} more tasks
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onExecute}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Execute Plan
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default WorkforceChat;
