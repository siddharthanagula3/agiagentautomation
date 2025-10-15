/**
 * Token Billing Tracker
 * Displays real-time token usage and costs by LLM provider
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/lib/utils';
import { useTokenUsage } from '@shared/stores/company-hub-store';
import { DollarSign, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

const getProviderBadgeColor = (provider: string) => {
  const colors = {
    openai: 'bg-green-500/20 text-green-400 border-green-500/30',
    anthropic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return (
    colors[provider as keyof typeof colors] ||
    'bg-gray-500/20 text-gray-400 border-gray-500/30'
  );
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
};

const formatCost = (cost: number): string => {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
};

interface TokenBillingTrackerProps {
  className?: string;
}

export const TokenBillingTracker: React.FC<TokenBillingTrackerProps> = ({
  className,
}) => {
  const { byModel, totalTokens, totalCost } = useTokenUsage();

  const hasUsage = Object.keys(byModel).length > 0;
  const isHighUsage = totalTokens > 5000;
  const isVeryHighUsage = totalTokens > 10000;

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Session Usage
            </h3>
          </div>
          {isHighUsage && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isVeryHighUsage
                  ? 'border-red-500/30 bg-red-500/20 text-red-400'
                  : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
              )}
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {isVeryHighUsage ? 'Very High' : 'High Usage'}
            </Badge>
          )}
        </div>

        {!hasUsage ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <DollarSign className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No token usage yet</p>
          </div>
        ) : (
          <>
            {/* Total Summary */}
            <div className="mb-4 rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatTokens(totalTokens)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCost(totalCost)}
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown by Model */}
            <div className="space-y-2">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Breakdown by Model
                </p>
              </div>

              {Object.entries(byModel).map(([model, stats], index) => (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded border border-border bg-background/30 p-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getProviderBadgeColor(stats.provider)
                        )}
                      >
                        {stats.provider}
                      </Badge>
                      <p className="truncate text-xs font-medium text-foreground">
                        {model
                          .replace('claude-', '')
                          .replace('gpt-', 'GPT-')
                          .replace('gemini-', 'Gemini ')}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-primary">
                      {formatCost(stats.cost)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTokens(stats.totalTokens)} tokens</span>
                    <span>
                      {stats.callCount}{' '}
                      {stats.callCount === 1 ? 'call' : 'calls'}
                    </span>
                  </div>

                  {/* Token breakdown */}
                  {stats.inputTokens > 0 && stats.outputTokens > 0 && (
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        In: {formatTokens(stats.inputTokens)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        Out: {formatTokens(stats.outputTokens)}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Warning Messages */}
            {isHighUsage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'mt-3 rounded-lg border p-2 text-xs',
                  isVeryHighUsage
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <p>
                    {isVeryHighUsage
                      ? 'Very high token usage detected. Consider reviewing task complexity.'
                      : 'High token usage. Monitor costs closely.'}
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
