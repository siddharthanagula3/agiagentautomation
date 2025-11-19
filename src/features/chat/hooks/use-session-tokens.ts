import { useState, useEffect } from 'react';
import { tokenLogger } from '@core/integrations/token-usage-tracker';

interface SessionTokens {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

/**
 * Hook to get cumulative token usage for the current chat session
 */
export function useSessionTokens(sessionId: string | undefined): SessionTokens {
  const [tokens, setTokens] = useState<SessionTokens>({
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
  });

  useEffect(() => {
    if (!sessionId) {
      setTokens({
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
      });
      return;
    }

    // Get session token usage
    const usage = tokenLogger.getSessionUsage(sessionId);

    setTokens({
      totalTokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalCost: usage.totalCost,
    });

    // Poll every 2 seconds for updates
    const interval = setInterval(() => {
      const updatedUsage = tokenLogger.getSessionUsage(sessionId);
      setTokens({
        totalTokens: updatedUsage.totalTokens,
        inputTokens: updatedUsage.inputTokens,
        outputTokens: updatedUsage.outputTokens,
        totalCost: updatedUsage.totalCost,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return tokens;
}
