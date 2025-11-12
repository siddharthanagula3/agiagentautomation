/**
 * Usage Warning Banner
 * Alerts users when approaching token limits (ChatGPT/Claude.ai style)
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@shared/ui/alert';
import { Button } from '@shared/ui/button';
import { Progress } from '@shared/ui/progress';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@shared/lib/supabase-client';

interface UsageData {
  used: number;
  limit: number;
  provider: string;
}

interface UsageWarningBannerProps {
  usageData: UsageData[];
  className?: string;
}

export function UsageWarningBanner({
  usageData,
  className,
}: UsageWarningBannerProps) {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Find the provider with highest usage percentage
  const criticalProvider = usageData.reduce<{
    provider: string;
    percentage: number;
    used: number;
    limit: number;
  } | null>((acc, data) => {
    const percentage = (data.used / data.limit) * 100;
    if (!acc || percentage > acc.percentage) {
      return { ...data, percentage };
    }
    return acc;
  }, null);

  if (!criticalProvider) return null;

  const { provider, percentage, used, limit } = criticalProvider;

  // Only show warning if over 80%
  if (percentage < 80) return null;

  // Don't show if dismissed
  if (dismissed[provider]) return null;

  const isOverLimit = percentage >= 100;
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 80 && percentage < 90;

  const severity = isOverLimit ? 'error' : isCritical ? 'critical' : 'warning';

  const getMessage = () => {
    if (isOverLimit) {
      return {
        title: `${provider} Token Limit Exceeded`,
        description: `You've used ${used.toLocaleString()} of ${limit.toLocaleString()} tokens (${percentage.toFixed(0)}%). Please upgrade your plan to continue using ${provider}.`,
        action: 'Upgrade Now',
      };
    }
    if (isCritical) {
      return {
        title: `Approaching ${provider} Token Limit`,
        description: `You've used ${used.toLocaleString()} of ${limit.toLocaleString()} tokens (${percentage.toFixed(0)}%). Consider upgrading to avoid interruptions.`,
        action: 'View Plans',
      };
    }
    return {
      title: `High ${provider} Token Usage`,
      description: `You've used ${used.toLocaleString()} of ${limit.toLocaleString()} tokens (${percentage.toFixed(0)}%).`,
      action: 'Monitor Usage',
    };
  };

  const { title, description, action } = getMessage();

  return (
    <Alert
      variant={isOverLimit ? 'destructive' : 'default'}
      className={cn(
        'relative',
        isCritical && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
        isWarning && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isOverLimit ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : (
          <AlertTriangle
            className={cn(
              'h-5 w-5',
              isCritical && 'text-orange-600 dark:text-orange-400',
              isWarning && 'text-yellow-600 dark:text-yellow-400'
            )}
          />
        )}

        <div className="flex-1 space-y-2">
          <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-xs">{description}</AlertDescription>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={percentage}
              className={cn(
                'h-2',
                isOverLimit && 'bg-red-200 dark:bg-red-900/20',
                isCritical && 'bg-orange-200 dark:bg-orange-900/20',
                isWarning && 'bg-yellow-200 dark:bg-yellow-900/20'
              )}
              indicatorClassName={cn(
                isOverLimit && 'bg-red-600',
                isCritical && 'bg-orange-600',
                isWarning && 'bg-yellow-600'
              )}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{used.toLocaleString()} used</span>
              <span>{limit.toLocaleString()} limit</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={isOverLimit ? 'default' : 'outline'}
              onClick={() => navigate('/billing')}
              className="h-7 text-xs"
            >
              {isOverLimit ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {action}
                </>
              ) : (
                <>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {action}
                </>
              )}
            </Button>

            {!isOverLimit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed({ ...dismissed, [provider]: true })}
                className="h-7 text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {!isOverLimit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed({ ...dismissed, [provider]: true })}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Hook to fetch and monitor usage data
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useUsageMonitoring(userId: string | null) {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        // Fetch from Supabase token_usage table
        if (userId) {
          const { data, error: fetchError } = await supabase
            .from('token_usage')
            .select('provider, total_tokens')
            .eq('user_id', userId)
            .gte(
              'created_at',
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            ); // Last 30 days

          if (!fetchError && data) {
            // Aggregate by provider
            const providerMap = new Map<string, number>();
            data.forEach((row) => {
              const provider = row.provider.toLowerCase();
              const current = providerMap.get(provider) || 0;
              providerMap.set(provider, current + (row.total_tokens || 0));
            });

            // Get user plan to determine limits
            const { data: userData } = await supabase
              .from('users')
              .select('plan')
              .eq('id', userId)
              .single();

            const isPro = userData?.plan === 'pro';
            const freeLimit = 250000; // 250K per provider for free
            const proLimit = 2500000; // 2.5M per provider for pro

            const usageData: UsageData[] = [
              {
                provider: 'OpenAI',
                used: providerMap.get('openai') || 0,
                limit: isPro ? proLimit : freeLimit,
              },
              {
                provider: 'Anthropic',
                used: providerMap.get('anthropic') || 0,
                limit: isPro ? proLimit : freeLimit,
              },
              {
                provider: 'Google',
                used: providerMap.get('google') || 0,
                limit: isPro ? proLimit : freeLimit,
              },
              {
                provider: 'Perplexity',
                used: providerMap.get('perplexity') || 0,
                limit: isPro ? proLimit : freeLimit,
              },
            ];

            setUsageData(usageData);
          } else {
            // Fallback to empty data if fetch fails
            setUsageData([]);
          }
        } else {
          setUsageData([]);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  return { usageData, isLoading };
}
