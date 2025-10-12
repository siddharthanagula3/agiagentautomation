/**
 * Token Usage Warning Component
 * Displays a warning banner when user reaches 90% token usage for an LLM provider
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/stores/unified-auth-store';
import { AlertTriangle, Zap, Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface TokenUsageWarningProps {
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  className?: string;
}

interface TokenUsage {
  provider: string;
  tokensUsed: number;
  tokenLimit: number;
  percentageUsed: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export const TokenUsageWarning: React.FC<TokenUsageWarningProps> = ({
  provider,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokenUsage = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get user's current plan
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user plan:', userError);
        return;
      }

      const plan = userData?.plan || 'free';

      // Get token usage for the provider
      const { data: usageData, error: usageError } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('llm_provider', provider)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ); // Last 30 days

      if (usageError) {
        console.error('Error fetching token usage:', usageError);
        return;
      }

      // Calculate total tokens used
      const tokensUsed =
        usageData?.reduce(
          (sum, record) => sum + (record.total_tokens || 0),
          0
        ) || 0;

      // Get token limits based on plan
      const tokenLimits = {
        free: 250000, // 250K per LLM
        pro: 2500000, // 2.5M per LLM
        enterprise: 10000000, // 10M per LLM
      };

      const tokenLimit =
        tokenLimits[plan as keyof typeof tokenLimits] || tokenLimits.free;
      // Ensure percentage is calculated correctly and handle edge cases
      const percentageUsed =
        tokenLimit > 0
          ? Math.min(Math.max((tokensUsed / tokenLimit) * 100, 0), 100)
          : 0;

      const usageInfo = {
        provider,
        tokensUsed,
        tokenLimit,
        percentageUsed,
        plan: plan as 'free' | 'pro' | 'enterprise',
      };

      if (import.meta.env.DEV) {
        console.log('Token usage data:', usageInfo);
      }
      setUsage(usageInfo);
    } catch (error) {
      console.error('Error fetching token usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, provider]);

  useEffect(() => {
    if (user) {
      fetchTokenUsage();

      // Refresh usage every 30 seconds
      const interval = setInterval(fetchTokenUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchTokenUsage]);

  // Don't show warning if dismissed, loading, or usage is below 90%
  if (isDismissed || isLoading || !usage || usage.percentageUsed < 90) {
    return null;
  }

  const getWarningColor = () => {
    if (usage.percentageUsed >= 100) return 'destructive';
    if (usage.percentageUsed >= 95) return 'destructive';
    return 'default';
  };

  const getWarningMessage = () => {
    if (usage.percentageUsed >= 100) {
      return `You've reached your ${usage.plan} plan limit for ${usage.provider}. Upgrade to continue using this provider.`;
    }
    if (usage.percentageUsed >= 95) {
      return `You're at ${Math.round(usage.percentageUsed)}% of your ${usage.provider} token limit. Consider upgrading your plan.`;
    }
    return `You're approaching your ${usage.provider} token limit (${Math.round(usage.percentageUsed)}% used).`;
  };

  const getUpgradeButton = () => {
    if (usage.plan === 'free') {
      return (
        <Button size="sm" asChild>
          <Link to="/pricing">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Link>
        </Button>
      );
    }
    if (usage.plan === 'pro') {
      return (
        <Button size="sm" asChild>
          <Link to="/pricing">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Enterprise
          </Link>
        </Button>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Alert variant={getWarningColor()}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-medium">{getWarningMessage()}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <Progress value={usage.percentageUsed} className="h-2 w-32" />
                  <span className="text-sm text-muted-foreground">
                    {usage.tokensUsed.toLocaleString()} /{' '}
                    {usage.tokenLimit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getUpgradeButton()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};
