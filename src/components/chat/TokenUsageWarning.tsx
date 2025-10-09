/**
 * Token Usage Warning Component
 * Displays a warning banner when user reaches 90% token usage for an LLM provider
 */

import React, { useEffect, useState } from 'react';
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

export const TokenUsageWarning: React.FC<TokenUsageWarningProps> = ({ provider, className = '' }) => {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTokenUsage();
      
      // Refresh usage every 30 seconds
      const interval = setInterval(fetchTokenUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [user, provider]);

  const fetchTokenUsage = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch user's plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      const userPlan = userData?.plan || 'free';

      // Set limits based on plan
      const tokenLimit = userPlan === 'pro' ? 2500000 : 
                        userPlan === 'enterprise' ? 999999999 : 
                        250000;

      // Fetch token usage for this provider this month
      const { data: usageData, error } = await supabase
        .from('token_usage')
        .select('total_tokens')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()); // Start of month

      if (error) {
        console.error('[Token Warning] Error fetching usage:', error);
        return;
      }

      const tokensUsed = usageData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;
      const percentageUsed = (tokensUsed / tokenLimit) * 100;

      setUsage({
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        tokensUsed,
        tokenLimit,
        percentageUsed,
        plan: userPlan as 'free' | 'pro' | 'enterprise',
      });
    } catch (err) {
      console.error('[Token Warning] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if dismissed or loading or no usage data
  if (isDismissed || isLoading || !usage) {
    return null;
  }

  // Only show warning if usage is 90% or above
  if (usage.percentageUsed < 90) {
    return null;
  }

  const isAtLimit = usage.percentageUsed >= 100;
  const isNearLimit = usage.percentageUsed >= 90 && usage.percentageUsed < 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Alert 
          variant={isAtLimit ? 'destructive' : 'default'}
          className={`relative ${isAtLimit ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}
        >
          <div className="flex items-start gap-3 pr-8">
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`} />
            
            <div className="flex-1 space-y-2">
              <AlertDescription className="font-medium">
                {isAtLimit ? (
                  <span className="text-red-900 dark:text-red-200">
                    ⚠️ Token Limit Reached for {usage.provider}
                  </span>
                ) : (
                  <span className="text-amber-900 dark:text-amber-200">
                    ⚠️ High Token Usage for {usage.provider}
                  </span>
                )}
              </AlertDescription>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={isAtLimit ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}>
                    {usage.tokensUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()} tokens used
                  </span>
                  <span className={`font-semibold ${isAtLimit ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'}`}>
                    {usage.percentageUsed.toFixed(1)}%
                  </span>
                </div>
                
                <Progress 
                  value={Math.min(usage.percentageUsed, 100)} 
                  className={`h-2 ${isAtLimit ? 'bg-red-200 dark:bg-red-900' : 'bg-amber-200 dark:bg-amber-900'}`}
                  indicatorClassName={isAtLimit ? 'bg-red-600' : 'bg-amber-600'}
                />
              </div>

              <AlertDescription className="text-sm">
                {isAtLimit ? (
                  <span className="text-red-800 dark:text-red-300">
                    You've reached your {usage.provider} token limit for this month. 
                    {usage.plan === 'free' && ' Upgrade to Pro for 10x more tokens!'}
                  </span>
                ) : (
                  <span className="text-amber-800 dark:text-amber-300">
                    You're approaching your {usage.provider} token limit. 
                    {usage.plan === 'free' && ' Consider upgrading to Pro for more tokens.'}
                  </span>
                )}
              </AlertDescription>

              {usage.plan === 'free' && (
                <div className="flex gap-2 mt-3">
                  <Link to="/billing">
                    <Button size="sm" className="h-8 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Crown className="h-4 w-4" />
                      Upgrade to Pro
                      <Zap className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link to="/billing">
                    <Button size="sm" variant="outline" className="h-8">
                      View Usage
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default TokenUsageWarning;

