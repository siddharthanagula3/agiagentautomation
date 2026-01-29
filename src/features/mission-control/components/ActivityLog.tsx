/**
 * Mission Log Enhanced
 * Displays mission plan and real-time activity log
 *
 * Performance optimizations:
 * - React.memo on the main component and sub-components
 * - useMemo for computed values
 * - useCallback for event handlers
 */

import React, { useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@shared/ui/accordion';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  User,
  Bot,
  Sparkles,
  ListTodo,
  AlertTriangle,
} from 'lucide-react';
import {
  useMissionPlan,
  useMissionMessages,
} from '@shared/stores/mission-control-store';
import type {
  Task,
  MissionMessage,
} from '@shared/stores/mission-control-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@shared/lib/utils';

// Memoize remarkPlugins array at module level
const REMARK_PLUGINS = [remarkGfm];

const getTaskStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTaskStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500 border-green-500/30';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    case 'failed':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getMessageIcon = (
  type: MissionMessage['type'],
  from: string,
  role?: 'agent' | 'supervisor' | 'user'
) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'system':
      return <Sparkles className="h-4 w-4 text-primary" />;
    case 'agent':
      // Differentiate between supervisor and regular agents
      if (role === 'supervisor') {
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      }
      return <Bot className="h-4 w-4 text-blue-500" />;
    case 'assistant':
      return <Bot className="h-4 w-4 text-green-500" />;
    case 'status':
      return <Loader2 className="h-4 w-4 text-muted-foreground" />;
    case 'employee':
      return <Bot className="h-4 w-4 text-purple-500" />;
    case 'plan':
      return <ListTodo className="h-4 w-4 text-blue-500" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

const getMessageColor = (
  type: MissionMessage['type'],
  role?: 'agent' | 'supervisor' | 'user'
) => {
  switch (type) {
    case 'user':
      return 'bg-primary text-primary-foreground';
    case 'system':
      return 'bg-muted/50 text-muted-foreground border border-border';
    case 'agent':
      // Supervisor messages get different styling
      if (role === 'supervisor') {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      }
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
    case 'assistant':
      return 'bg-green-500/10 text-green-400 border border-green-500/30';
    case 'status':
      return 'bg-muted/30 text-muted-foreground border border-border text-xs';
    case 'employee':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    case 'plan':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
    case 'error':
      return 'bg-red-500/10 text-red-400 border border-red-500/30';
    default:
      return 'bg-card text-foreground border border-border';
  }
};

// Memoized task item component
const TaskItem = memo(function TaskItem({
  task,
  index,
}: {
  task: Task;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-lg border p-2 transition-all sm:p-3',
        getTaskStatusColor(task.status)
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {getTaskStatusIcon(task.status)}
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium sm:text-sm">{task.description}</p>
          {task.assignedTo && (
            <p className="text-[10px] opacity-75 sm:text-xs">
              Assigned to: {task.assignedTo}
            </p>
          )}
          {task.result && (
            <div className="mt-1 rounded bg-background/50 p-1.5 sm:mt-2 sm:p-2">
              <p className="text-[10px] sm:text-xs">{task.result}</p>
            </div>
          )}
          {task.error && (
            <div className="mt-1 rounded bg-red-500/10 p-1.5 sm:mt-2 sm:p-2">
              <p className="text-[10px] text-red-400 sm:text-xs">
                Error: {task.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Memoized message item component
const MessageItem = memo(function MessageItem({
  message,
  index,
}: {
  message: MissionMessage;
  index: number;
}) {
  // Extract metadata for agent messages
  const employeeName = message.metadata?.employeeName || message.from;
  const employeeAvatar = message.metadata?.employeeAvatar;
  const role = message.metadata?.role as
    | 'agent'
    | 'supervisor'
    | 'user'
    | undefined;

  // Memoize avatar URL computation
  const avatarUrl = useMemo(() => {
    if (employeeAvatar) return employeeAvatar;
    if (message.type === 'system')
      return 'https://api.dicebear.com/7.x/shapes/svg?seed=system';
    if (message.type === 'agent' && role === 'supervisor')
      return 'https://api.dicebear.com/7.x/shapes/svg?seed=supervisor';
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${employeeName}`;
  }, [employeeAvatar, message.type, role, employeeName]);

  // Memoize timestamp formatting
  const formattedTime = useMemo(
    () => new Date(message.timestamp).toLocaleTimeString(),
    [message.timestamp]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex items-start gap-2 sm:gap-3',
        message.type === 'user' && 'justify-end'
      )}
    >
      {message.type !== 'user' && (
        <Avatar className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8">
          <AvatarImage src={avatarUrl} alt={employeeName} />
          <AvatarFallback className="bg-primary/10">
            {getMessageIcon(message.type, message.from, role)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[90%] flex-1 sm:max-w-[85%]',
          message.type === 'user' && 'flex justify-end'
        )}
      >
        {/* Message Sender */}
        {message.from !== 'user' && (
          <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-2">
            <p className="text-[10px] font-semibold text-foreground sm:text-xs">
              {employeeName}
            </p>
            {role && role !== 'user' && (
              <Badge
                variant="outline"
                className="px-1 py-0 text-[9px] sm:px-1.5 sm:text-[10px]"
              >
                {role === 'supervisor' ? 'Supervisor' : 'Agent'}
              </Badge>
            )}
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {formattedTime}
            </p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn('rounded-lg p-2 sm:p-3', getMessageColor(message.type, role))}
        >
          {message.type === 'user' ? (
            <p className="text-xs sm:text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-full overflow-x-auto">
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {message.type === 'user' && (
        <Avatar className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8">
          <AvatarFallback className="bg-primary">
            <User className="h-3 w-3 text-primary-foreground sm:h-4 sm:w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
});

export const MissionLogEnhanced = memo(function MissionLogEnhanced() {
  const missionPlan = useMissionPlan();
  const messages = useMissionMessages();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Memoize computed values
  const { hasPlan, completedTasks, totalTasks } = useMemo(
    () => ({
      hasPlan: missionPlan.length > 0,
      completedTasks: missionPlan.filter((t) => t.status === 'completed').length,
      totalTasks: missionPlan.length,
    }),
    [missionPlan]
  );

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ListTodo className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          Mission Log
        </CardTitle>
        {hasPlan && (
          <p className="text-xs text-muted-foreground sm:text-sm">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-4">
        {/* Mission Plan Accordion */}
        {hasPlan && (
          <Accordion type="single" collapsible defaultValue="plan">
            <AccordionItem value="plan" className="border-border">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  <span>Mission Plan ({totalTasks} tasks)</span>
                  <Badge variant="outline" className="ml-2">
                    {completedTasks}/{totalTasks}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {missionPlan.map((task, index) => (
                    <TaskItem key={task.id} task={task} index={index} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Activity Log */}
        <div className="space-y-2 sm:space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center sm:h-64">
              <Sparkles className="mb-3 h-10 w-10 text-muted-foreground opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
              <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                Mission Control Ready
              </h3>
              <p className="max-w-sm px-4 text-xs text-muted-foreground sm:px-0 sm:text-sm">
                Your AI Workforce Mission Control is ready. Start a mission to
                deploy your AI employees.
              </p>
            </div>
          ) : (
            <>
              <h4 className="text-xs font-semibold text-foreground sm:text-sm">
                Activity Log
              </h4>
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    index={index}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
