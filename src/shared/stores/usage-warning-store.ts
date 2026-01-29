import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Usage Warning Store
 *
 * Tracks token usage and shows warnings at 85% and 95% thresholds
 * to prevent service interruption. Reminds users to buy more tokens.
 */

// Initial state for reset functionality
const initialState = {
  hasShown85Warning: false,
  hasShown95Warning: false,
  lastWarningTime: null as number | null,
  currentUsage: 0,
  totalLimit: 50000, // Default: 50K tokens for free tier
  usagePercentage: 0,
};

export interface UsageWarningState {
  // Warning state
  hasShown85Warning: boolean;
  hasShown95Warning: boolean;
  lastWarningTime: number | null;

  // Current usage data
  currentUsage: number;
  totalLimit: number;
  usagePercentage: number;

  // Actions
  updateUsage: (used: number, limit: number) => void;
  markWarningShown: (threshold: 85 | 95) => void;
  resetWarnings: () => void;
  shouldShowWarning: (threshold: 85 | 95) => boolean;
  getDismissedWarnings: () => { '85': boolean; '95': boolean };
  reset: () => void;
}

const enableDevtools = import.meta.env.MODE !== 'production';

export const useUsageWarningStore = create<UsageWarningState>()(
  devtools(
    persist(
      immer((set, get) => ({
        hasShown85Warning: false,
        hasShown95Warning: false,
        lastWarningTime: null,
        currentUsage: 0,
        totalLimit: 50000, // Default: 50K tokens for free tier
        usagePercentage: 0,

        updateUsage: (used: number, limit: number) => {
          const percentage = (used / limit) * 100;

          set({
            currentUsage: used,
            totalLimit: limit,
            usagePercentage: percentage,
          });
        },

        markWarningShown: (threshold: 85 | 95) => {
          set({
            [threshold === 85 ? 'hasShown85Warning' : 'hasShown95Warning']:
              true,
            lastWarningTime: Date.now(),
          });
        },

        shouldShowWarning: (threshold: 85 | 95) => {
          const state = get();
          const hasShown =
            threshold === 85
              ? state.hasShown85Warning
              : state.hasShown95Warning;

            // Show warning if:
            // 1. Usage >= threshold
            // 2. Warning hasn't been shown yet this session
            // 3. Or it's been more than 1 hour since last warning
            const oneHourAgo = Date.now() - 60 * 60 * 1000;
            const canShowAgain =
              !state.lastWarningTime || state.lastWarningTime < oneHourAgo;

            return (
              state.usagePercentage >= threshold && (!hasShown || canShowAgain)
            );
          },

          resetWarnings: () => {
            set({
              hasShown85Warning: false,
              hasShown95Warning: false,
              lastWarningTime: null,
            });
          },

          getDismissedWarnings: () => {
            const state = get();
            return {
              '85': state.hasShown85Warning,
              '95': state.hasShown95Warning,
            };
          },

          reset: () => {
            set(() => ({ ...initialState }));
          },
        })),
      {
        name: 'usage-warning-storage',
        partialize: (state) => ({
          hasShown85Warning: state.hasShown85Warning,
          hasShown95Warning: state.hasShown95Warning,
          lastWarningTime: state.lastWarningTime,
        }),
      }
    ),
    { name: 'UsageWarningStore', enabled: enableDevtools }
  )
);
