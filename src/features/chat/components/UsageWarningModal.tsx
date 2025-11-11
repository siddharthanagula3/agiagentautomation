import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { useNavigate } from 'react-router-dom';

interface UsageWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threshold: 85 | 95;
  currentUsage: number;
  totalLimit: number;
  usagePercentage: number;
}

/**
 * Usage Warning Modal
 *
 * Pops up when user reaches 85% or 95% of their token limit.
 * Provides clear CTAs to buy more tokens and avoid service interruption.
 *
 * Inspired by Anthropic Claude's usage warnings for seamless UX.
 */
export function UsageWarningModal({
  open,
  onOpenChange,
  threshold,
  currentUsage,
  totalLimit,
  usagePercentage,
}: UsageWarningModalProps) {
  const navigate = useNavigate();
  const remainingTokens = totalLimit - currentUsage;
  const remainingPercentage = 100 - usagePercentage;

  const handleBuyTokens = () => {
    onOpenChange(false);
    navigate('/billing?action=buy-tokens');
  };

  const handleViewBilling = () => {
    onOpenChange(false);
    navigate('/billing');
  };

  // Warning severity based on threshold
  const isCritical = threshold === 95;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`sm:max-w-[500px] ${isCritical ? 'border-red-500/50' : 'border-yellow-500/50'}`}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-3 ${
                isCritical
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-yellow-500/10 text-yellow-500'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left text-xl">
                {isCritical ? '⚠️ Critical: ' : '⚠️ Warning: '}
                {threshold}% Token Usage Reached
              </AlertDialogTitle>
            </div>
          </div>

          <AlertDialogDescription className="space-y-4 pt-4 text-left">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Current Usage</span>
                <span className={`font-bold ${isCritical ? 'text-red-500' : 'text-yellow-500'}`}>
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCritical
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {currentUsage.toLocaleString()} / {totalLimit.toLocaleString()} tokens
                </span>
                <span className="font-medium">
                  {remainingTokens.toLocaleString()} left ({remainingPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            {isCritical ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="mb-2 font-semibold text-red-600 dark:text-red-400">
                  🚨 Service May Be Interrupted Soon
                </p>
                <p className="text-sm text-muted-foreground">
                  You're at 95% usage. Buy more tokens now to avoid interruption.
                  Your AI employees need tokens to continue working.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="mb-2 font-semibold text-yellow-600 dark:text-yellow-400">
                  ⚡ Running Low on Tokens
                </p>
                <p className="text-sm text-muted-foreground">
                  You've used 85% of your monthly tokens. Consider buying more
                  to ensure uninterrupted service.
                </p>
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                💡 Why Buy More Tokens?
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>No service interruption - your AI employees keep working 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Market-rate pricing - same as direct OpenAI/Anthropic usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Instant activation - tokens available immediately</span>
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={handleViewBilling}>
            View Billing Dashboard
          </AlertDialogCancel>
          <Button
            onClick={handleBuyTokens}
            className={`gap-2 ${
              isCritical
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-primary to-accent'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Buy More Tokens
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
