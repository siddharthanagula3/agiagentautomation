/**
 * Collaborative Message Display
 * Shows multi-agent conversations with avatars, tool usage, and inline collaboration
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Card, CardContent } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import {
  Bot,
  User,
  Wrench,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { AgentMessage } from '@core/ai/orchestration/agent-collaboration-protocol';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CollaborativeMessageDisplayProps {
  message: AgentMessage;
  showAvatar?: boolean;
  className?: string;
}

export const CollaborativeMessageDisplay: React.FC<
  CollaborativeMessageDisplayProps
> = ({ message, showAvatar = true, className }) => {
  const [isToolExpanded, setIsToolExpanded] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Get message styling based on type
  const getMessageStyle = () => {
    switch (message.type) {
      case 'user':
        return {
          bg: 'bg-primary/10 dark:bg-primary/20',
          border: 'border-primary/20',
          align: 'ml-auto',
          maxWidth: 'max-w-[85%]',
        };
      case 'agent':
        return {
          bg: message.isIntermediate
            ? 'bg-slate-100 dark:bg-slate-800/50'
            : 'bg-white dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          align: 'mr-auto',
          maxWidth: 'max-w-[85%]',
        };
      case 'tool':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          align: 'mr-auto',
          maxWidth: 'max-w-[70%]',
        };
      case 'system':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          align: 'mx-auto',
          maxWidth: 'max-w-[60%]',
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          align: 'mr-auto',
          maxWidth: 'max-w-[85%]',
        };
    }
  };

  const style = getMessageStyle();

  // Render user message
  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex items-start space-x-3 mb-4', className)}
      >
        {showAvatar && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <Card
          className={cn(
            'border shadow-sm',
            style.bg,
            style.border,
            style.align,
            style.maxWidth,
            className
          )}
        >
          <CardContent className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{message.timestamp.toLocaleTimeString()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2"
              >
                {isCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Render tool usage message
  if (message.type === 'tool') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex items-start space-x-3 mb-4', className)}
      >
        {showAvatar && (
          <Avatar className="h-8 w-8 shrink-0">
            {message.agentAvatar ? (
              <AvatarImage src={message.agentAvatar} alt={message.agentName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {message.agentName?.charAt(0) || <Bot className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        <Card
          className={cn(
            'border shadow-sm',
            style.bg,
            style.border,
            style.maxWidth,
            className
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-sm">
                  {message.agentName} used {message.toolName}
                </span>
                <Badge variant="outline" className="text-xs">
                  Tool
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsToolExpanded(!isToolExpanded)}
                className="h-6 px-2"
              >
                {isToolExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            <AnimatePresence>
              {isToolExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2"
                >
                  {message.toolArgs && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Arguments:
                      </div>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(message.toolArgs, null, 2)}
                      </pre>
                    </div>
                  )}
                  {message.toolResult && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Result:
                      </div>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto max-h-40">
                        {typeof message.toolResult === 'string'
                          ? message.toolResult
                          : JSON.stringify(message.toolResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-2 text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Render agent message
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start space-x-3 mb-4', className)}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          {message.agentAvatar ? (
            <AvatarImage src={message.agentAvatar} alt={message.agentName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {message.agentName?.charAt(0) || <Bot className="h-4 w-4" />}
            </AvatarFallback>
          )}
        </Avatar>
      )}
      <Card
        className={cn(
          'border shadow-sm transition-all',
          style.bg,
          style.border,
          style.maxWidth,
          message.isIntermediate && 'opacity-75',
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">{message.agentName}</span>
              {message.isIntermediate && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Processing
                </Badge>
              )}
              {message.metadata?.model && (
                <Badge variant="outline" className="text-xs">
                  {message.metadata.model}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2"
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              message.isIntermediate && 'text-sm'
            )}
          >
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {message.metadata?.reasoning && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <MessageSquare className="inline h-3 w-3 mr-1" />
                View reasoning
              </summary>
              <div className="mt-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                {message.metadata.reasoning}
              </div>
            </details>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.metadata?.tokensUsed && (
              <span className="text-xs">
                {message.metadata.tokensUsed} tokens
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CollaborativeMessageDisplay;
