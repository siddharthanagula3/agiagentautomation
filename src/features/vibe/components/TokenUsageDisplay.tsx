/**
 * Token Usage Display
 * Shows real-time token usage and cost for the current vibe session
 *
 * Created: Nov 18th 2025
 */

import React, { useEffect, useState } from 'react';
import { DollarSign, Zap } from 'lucide-react';
import { getSessionTokenUsage } from '../services/vibe-token-tracker';

interface TokenUsageDisplayProps {
  sessionId: string | null;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  sessionId,
}) => {
  const [usage, setUsage] = useState<{
    totalTokens: number;
    totalCost: number;
  }>({ totalTokens: 0, totalCost: 0 });

  useEffect(() => {
    if (!sessionId) return;

    // Initial load
    const sessionUsage = getSessionTokenUsage(sessionId);
    setUsage(sessionUsage);

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      const updated = getSessionTokenUsage(sessionId);
      setUsage(updated);
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId || usage.totalTokens === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-1.5 text-xs">
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-yellow-500" />
        <span className="font-medium">
          {usage.totalTokens.toLocaleString()}
        </span>
        <span className="text-muted-foreground">tokens</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-green-500" />
        <span className="font-medium">${usage.totalCost.toFixed(4)}</span>
      </div>
    </div>
  );
};
