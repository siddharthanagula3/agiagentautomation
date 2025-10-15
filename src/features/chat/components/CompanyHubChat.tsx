/**
 * Company Hub Chat
 * Multi-agent chat interface with real-time updates
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Bot,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useHubMessages } from '@shared/stores/company-hub-store';
import type { HubMessage } from '@shared/stores/company-hub-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const getMessageIcon = (type: HubMessage['type'], from: string) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'system':
      return <Sparkles className="h-4 w-4 text-primary" />;
    case 'handoff':
      return <ArrowRight className="h-4 w-4 text-blue-500" />;
    case 'completion':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'upsell':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

const getMessageColor = (type: HubMessage['type']) => {
  switch (type) {
    case 'user':
      return 'bg-primary text-primary-foreground';
    case 'system':
      return 'bg-muted/50 text-muted-foreground border border-border';
    case 'handoff':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
    case 'completion':
      return 'bg-green-500/10 text-green-400 border border-green-500/30';
    case 'error':
      return 'bg-red-500/10 text-red-400 border border-red-500/30';
    case 'upsell':
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
    default:
      return 'bg-card text-foreground border border-border';
  }
};

export const CompanyHubChat: React.FC = () => {
  const messages = useHubMessages();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Company Hub
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your collaborative AI workspace. Start a task and watch your team
              of AI employees work together.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-start gap-3',
                    message.type === 'user' && 'justify-end'
                  )}
                >
                  {message.type !== 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={
                          message.from === 'system'
                            ? 'https://api.dicebear.com/7.x/shapes/svg?seed=system'
                            : `https://api.dicebear.com/7.x/bottts/svg?seed=${message.from}`
                        }
                        alt={message.from}
                      />
                      <AvatarFallback>
                        {getMessageIcon(message.type, message.from)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] flex-1',
                      message.type === 'user' && 'flex justify-end'
                    )}
                  >
                    {/* Message Sender */}
                    {message.from !== 'user' && (
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">
                          {message.from}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {message.metadata?.provider || 'system'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
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
                      ) : message.type === 'system' ||
                        message.type === 'handoff' ||
                        message.type === 'completion' ||
                        message.type === 'error' ||
                        message.type === 'upsell' ? (
                        <div className="flex items-start gap-2">
                          {getMessageIcon(message.type, message.from)}
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Handoff indicator */}
                    {message.type === 'handoff' && message.to && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>to {message.to}</span>
                      </div>
                    )}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
