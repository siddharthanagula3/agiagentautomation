/**
 * Mission Log Enhanced
 * Displays mission plan and real-time activity log
 */

import React, { useRef, useEffect } from 'react';
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

const getMessageIcon = (type: MissionMessage['type'], from: string) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'system':
      return <Sparkles className="h-4 w-4 text-primary" />;
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

const getMessageColor = (type: MissionMessage['type']) => {
  switch (type) {
    case 'user':
      return 'bg-primary text-primary-foreground';
    case 'system':
      return 'bg-muted/50 text-muted-foreground border border-border';
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

export const MissionLogEnhanced: React.FC = () => {
  const missionPlan = useMissionPlan();
  const messages = useMissionMessages();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasPlan = missionPlan.length > 0;
  const completedTasks = missionPlan.filter(
    (t) => t.status === 'completed'
  ).length;
  const totalTasks = missionPlan.length;

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListTodo className="h-5 w-5 text-primary" />
          Mission Log
        </CardTitle>
        {hasPlan && (
          <p className="text-sm text-muted-foreground">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto">
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
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'rounded-lg border p-3 transition-all',
                        getTaskStatusColor(task.status)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {getTaskStatusIcon(task.status)}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {task.description}
                          </p>
                          {task.assignedTo && (
                            <p className="text-xs opacity-75">
                              Assigned to: {task.assignedTo}
                            </p>
                          )}
                          {task.result && (
                            <div className="mt-2 rounded bg-background/50 p-2">
                              <p className="text-xs">{task.result}</p>
                            </div>
                          )}
                          {task.error && (
                            <div className="mt-2 rounded bg-red-500/10 p-2">
                              <p className="text-xs text-red-400">
                                Error: {task.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Activity Log */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Mission Control Ready
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your AI Workforce Mission Control is ready. Start a mission to
                deploy your AI employees.
              </p>
            </div>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-foreground">
                Activity Log
              </h4>
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex items-start gap-3',
                      message.type === 'user' && 'justify-end'
                    )}
                  >
                    {message.type !== 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={
                            message.type === 'system'
                              ? 'https://api.dicebear.com/7.x/shapes/svg?seed=system'
                              : `https://api.dicebear.com/7.x/bottts/svg?seed=${message.from}`
                          }
                          alt={message.from}
                        />
                        <AvatarFallback className="bg-primary/10">
                          {getMessageIcon(message.type, message.from)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'max-w-[85%] flex-1',
                        message.type === 'user' && 'flex justify-end'
                      )}
                    >
                      {/* Message Sender */}
                      {message.from !== 'user' && (
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">
                            {message.from}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      )}

                      {/* Message Content */}
                      <div
                        className={cn(
                          'rounded-lg p-3',
                          getMessageColor(message.type)
                        )}
                      >
                        {message.type === 'user' ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
