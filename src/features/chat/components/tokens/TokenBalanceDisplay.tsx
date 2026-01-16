/**
 * Token Balance Display Component
 * Shows user's remaining token balance in the chat interface
 *
 * CRITICAL UX: Users need to see their balance to avoid unexpected interruptions
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@shared/stores/authentication-store';
import { getUserTokenBalance } from '@core/billing/token-enforcement-service';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Coins, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface TokenBalanceDisplayProps {
  compact?: boolean;
  className?: string;
}

export function TokenBalanceDisplay({
  compact = false,
  className,
}: TokenBalanceDisplayProps) {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load token balance
  useEffect(() => {
    if (!user?.id) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    const loadBalance = async () => {
      setIsLoading(true);
      const currentBalance = await getUserTokenBalance(user.id);
      setBalance(currentBalance);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    loadBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  if (!user) {
    return null;
  }

  if (isLoading && balance === null) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm',
          className
        )}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Loading balance...</span>
      </div>
    );
  }

  const balanceInMillions = (balance || 0) / 1000000;
  const isLow = balance !== null && balance < 100000; // Less than 100K tokens
  const isCritical = balance !== null && balance < 10000; // Less than 10K tokens

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
          isCritical && 'bg-red-100 text-red-700',
          isLow && !isCritical && 'bg-yellow-100 text-yellow-700',
          !isLow && 'bg-primary/10 text-primary',
          className
        )}
      >
        {isCritical ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Coins className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">
          {balanceInMillions.toFixed(2)}M tokens
        </span>
        {isCritical && (
          <Link to="/billing">
            <Button
              size="sm"
              variant="destructive"
              className="ml-2 h-6 text-xs"
            >
              Buy Now
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'border-2 transition-all hover:shadow-md',
        isCritical && 'border-red-300 bg-red-50',
        isLow && !isCritical && 'border-yellow-300 bg-yellow-50',
        !isLow && 'border-primary/30 bg-primary/5',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {isCritical ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700">Token Balance Critical</span>
                </>
              ) : isLow ? (
                <>
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-700">Token Balance Low</span>
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  <span>Token Balance</span>
                </>
              )}
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  'text-3xl font-bold',
                  isCritical && 'text-red-700',
                  isLow && !isCritical && 'text-yellow-700',
                  !isLow && 'text-primary'
                )}
              >
                {balanceInMillions.toFixed(2)}M
              </span>
              <span className="text-sm text-muted-foreground">tokens</span>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {balance !== null && balance.toLocaleString()} total tokens
            </div>

            {isCritical && (
              <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-700">
                ⚠️ <strong>Action Required:</strong> Your token balance is
                critically low. Purchase more tokens to continue using AI
                features.
              </div>
            )}

            {isLow && !isCritical && (
              <div className="mt-3 rounded-md bg-yellow-100 p-2 text-xs text-yellow-700">
                💡 <strong>Notice:</strong> You're running low on tokens.
                Consider purchasing more to avoid interruptions.
              </div>
            )}
          </div>

          <div className="ml-4 flex flex-col gap-2">
            <Link to="/billing">
              <Button
                size="sm"
                variant={isCritical ? 'destructive' : 'default'}
                className="w-full"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Buy Tokens
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setLastUpdate(new Date())}
              className="w-full"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-500',
                isCritical && 'bg-red-500',
                isLow && !isCritical && 'bg-yellow-500',
                !isLow && 'bg-primary'
              )}
              style={{
                width: `${Math.min(100, (balanceInMillions / 10) * 100)}%`, // 10M = 100%
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0M</span>
            <span>5M</span>
            <span>10M+</span>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
}

/**
 * Mini token balance badge for header/toolbar
 */
export function TokenBalanceBadge({ className }: { className?: string }) {
  return <TokenBalanceDisplay compact className={className} />;
}
