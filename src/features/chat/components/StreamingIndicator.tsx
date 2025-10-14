/**
 * Streaming Indicator Component
 * Visual indicator for streaming AI responses
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface StreamingIndicatorProps {
  provider?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'full';
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  provider,
  className,
  variant = 'default',
}) => {
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Streaming...</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center gap-3 rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-3',
          className
        )}
      >
        <div className="relative">
          <Zap className="h-5 w-5 text-blue-500" />
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="h-5 w-5 text-blue-400" />
          </motion.div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">AI is thinking...</div>
          {provider && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Powered by {provider}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-blue-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm',
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-muted-foreground">
        {provider ? `${provider} is responding...` : 'Streaming response...'}
      </span>
    </div>
  );
};

/**
 * Typing Indicator Component
 * Shows typing animation (like ChatGPT)
 */

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted px-4 py-3',
        className
      )}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-foreground/50"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="ml-1 text-sm text-muted-foreground">AI is typing</span>
    </div>
  );
};

/**
 * Token Counter Component
 * Shows token usage during streaming
 */

interface TokenCounterProps {
  tokens: number;
  maxTokens?: number;
  className?: string;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({
  tokens,
  maxTokens,
  className,
}) => {
  const percentage = maxTokens ? (tokens / maxTokens) * 100 : 0;
  const isNearLimit = percentage > 80;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className
      )}
    >
      <Zap className="h-3 w-3" />
      <span className={cn(isNearLimit && 'font-semibold text-yellow-500')}>
        {tokens.toLocaleString()}
        {maxTokens && ` / ${maxTokens.toLocaleString()}`} tokens
      </span>
      {maxTokens && (
        <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              'h-full transition-colors',
              isNearLimit ? 'bg-yellow-500' : 'bg-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Streaming Progress Bar
 * Smooth progress indicator
 */

interface StreamingProgressBarProps {
  className?: string;
}

export const StreamingProgressBar: React.FC<StreamingProgressBarProps> = ({
  className,
}) => {
  return (
    <div className={cn('h-1 overflow-hidden rounded-full bg-muted', className)}>
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ width: '50%' }}
      />
    </div>
  );
};
