/**
 * Token Usage Display Component
 * Shows token count and cost per message (like ChatGPT/Claude.ai)
 */

import React from 'react';
import { Badge } from '@shared/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import { Zap, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenUsageDisplayProps {
  tokensUsed: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  cost?: number;
  className?: string;
  variant?: 'compact' | 'detailed';
}

export function TokenUsageDisplay({
  tokensUsed,
  inputTokens,
  outputTokens,
  model,
  cost,
  className,
  variant = 'compact',
}: TokenUsageDisplayProps) {
  // Format cost to display
  const formattedCost = cost
    ? cost < 0.01
      ? `<$0.01`
      : `$${cost.toFixed(4)}`
    : null;

  // Format token counts
  const formatTokens = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                'flex items-center gap-1.5 text-xs font-normal',
                className
              )}
            >
              <Zap className="h-3 w-3" />
              <span>{formatTokens(tokensUsed)} tokens</span>
              {formattedCost && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>{formattedCost}</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1 text-xs">
              {model && (
                <div className="font-medium text-foreground">{model}</div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Input tokens:</span>
                <span className="font-mono">
                  {inputTokens ? formatTokens(inputTokens) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Output tokens:</span>
                <span className="font-mono">
                  {outputTokens ? formatTokens(outputTokens) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-1">
                <span className="font-medium">Total:</span>
                <span className="font-mono font-medium">
                  {formatTokens(tokensUsed)}
                </span>
              </div>
              {formattedCost && (
                <div className="flex items-center justify-between gap-4 text-green-600 dark:text-green-400">
                  <span className="font-medium">Cost:</span>
                  <span className="font-mono font-medium">{formattedCost}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3 text-xs',
        className
      )}
    >
      {model && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-medium">{model}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
          <span className="font-mono">{formatTokens(tokensUsed)}</span>
          <span className="text-muted-foreground">tokens</span>
        </div>

        {inputTokens && outputTokens && (
          <div className="text-muted-foreground">
            <span className="font-mono">{formatTokens(inputTokens)}</span>
            {' → '}
            <span className="font-mono">{formatTokens(outputTokens)}</span>
          </div>
        )}

        {formattedCost && (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-mono font-medium">{formattedCost}</span>
          </div>
        )}
      </div>
    </div>
  );
}
