/**
 * Usage Warning Store Tests
 *
 * Tests for token usage tracking and warning display logic.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUsageWarningStore } from './usage-warning-store';

describe('Usage Warning Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUsageWarningStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should have correct initial values', () => {
      const state = useUsageWarningStore.getState();

      expect(state.hasShown85Warning).toBe(false);
      expect(state.hasShown95Warning).toBe(false);
      expect(state.lastWarningTime).toBeNull();
      expect(state.currentUsage).toBe(0);
      expect(state.totalLimit).toBe(50000);
      expect(state.usagePercentage).toBe(0);
    });
  });

  describe('updateUsage', () => {
    it('should update usage and calculate percentage', () => {
      const { updateUsage } = useUsageWarningStore.getState();

      updateUsage(25000, 50000);

      const state = useUsageWarningStore.getState();
      expect(state.currentUsage).toBe(25000);
      expect(state.totalLimit).toBe(50000);
      expect(state.usagePercentage).toBe(50);
    });

    it('should handle edge cases correctly', () => {
      const { updateUsage } = useUsageWarningStore.getState();

      // Zero usage
      updateUsage(0, 50000);
      expect(useUsageWarningStore.getState().usagePercentage).toBe(0);

      // Full usage
      updateUsage(50000, 50000);
      expect(useUsageWarningStore.getState().usagePercentage).toBe(100);

      // Over limit
      updateUsage(60000, 50000);
      expect(useUsageWarningStore.getState().usagePercentage).toBe(120);
    });

    it('should update both used and limit values', () => {
      const { updateUsage } = useUsageWarningStore.getState();

      updateUsage(42500, 50000);

      const state = useUsageWarningStore.getState();
      expect(state.currentUsage).toBe(42500);
      expect(state.totalLimit).toBe(50000);
      expect(state.usagePercentage).toBe(85);
    });
  });

  describe('markWarningShown', () => {
    it('should mark 85% warning as shown', () => {
      const { markWarningShown } = useUsageWarningStore.getState();

      markWarningShown(85);

      const state = useUsageWarningStore.getState();
      expect(state.hasShown85Warning).toBe(true);
      expect(state.hasShown95Warning).toBe(false);
      expect(state.lastWarningTime).not.toBeNull();
    });

    it('should mark 95% warning as shown', () => {
      const { markWarningShown } = useUsageWarningStore.getState();

      markWarningShown(95);

      const state = useUsageWarningStore.getState();
      expect(state.hasShown85Warning).toBe(false);
      expect(state.hasShown95Warning).toBe(true);
      expect(state.lastWarningTime).not.toBeNull();
    });

    it('should update lastWarningTime', () => {
      const { markWarningShown } = useUsageWarningStore.getState();
      const now = Date.now();
      vi.setSystemTime(now);

      markWarningShown(85);

      const state = useUsageWarningStore.getState();
      expect(state.lastWarningTime).toBe(now);
    });
  });

  describe('shouldShowWarning', () => {
    it('should return false when usage is below threshold', () => {
      const { updateUsage, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(40000, 50000); // 80%

      expect(shouldShowWarning(85)).toBe(false);
      expect(shouldShowWarning(95)).toBe(false);
    });

    it('should return true when usage reaches 85% threshold', () => {
      const { updateUsage, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(42500, 50000); // 85%

      expect(shouldShowWarning(85)).toBe(true);
    });

    it('should return true when usage reaches 95% threshold', () => {
      const { updateUsage, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(47500, 50000); // 95%

      expect(shouldShowWarning(95)).toBe(true);
    });

    it('should return false after warning has been shown', () => {
      const { updateUsage, markWarningShown, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(42500, 50000); // 85%
      markWarningShown(85);

      expect(shouldShowWarning(85)).toBe(false);
    });

    it('should return true again after 1 hour', () => {
      const { updateUsage, markWarningShown, shouldShowWarning } =
        useUsageWarningStore.getState();
      const now = Date.now();
      vi.setSystemTime(now);

      updateUsage(42500, 50000); // 85%
      markWarningShown(85);

      // Initially should be false
      expect(shouldShowWarning(85)).toBe(false);

      // Advance time by more than 1 hour
      vi.setSystemTime(now + 61 * 60 * 1000);

      expect(useUsageWarningStore.getState().shouldShowWarning(85)).toBe(true);
    });

    it('should handle both thresholds independently', () => {
      const { updateUsage, markWarningShown, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(48000, 50000); // 96% - above both thresholds

      expect(shouldShowWarning(85)).toBe(true);
      expect(shouldShowWarning(95)).toBe(true);

      // Mark only 85% as shown
      markWarningShown(85);

      expect(useUsageWarningStore.getState().shouldShowWarning(85)).toBe(false);
      expect(useUsageWarningStore.getState().shouldShowWarning(95)).toBe(true);
    });
  });

  describe('resetWarnings', () => {
    it('should reset all warning flags', () => {
      const { markWarningShown, resetWarnings } =
        useUsageWarningStore.getState();

      markWarningShown(85);
      markWarningShown(95);

      resetWarnings();

      const state = useUsageWarningStore.getState();
      expect(state.hasShown85Warning).toBe(false);
      expect(state.hasShown95Warning).toBe(false);
      expect(state.lastWarningTime).toBeNull();
    });

    it('should not affect usage data', () => {
      const { updateUsage, markWarningShown, resetWarnings } =
        useUsageWarningStore.getState();

      updateUsage(42500, 50000);
      markWarningShown(85);
      resetWarnings();

      const state = useUsageWarningStore.getState();
      expect(state.currentUsage).toBe(42500);
      expect(state.totalLimit).toBe(50000);
      expect(state.usagePercentage).toBe(85);
    });
  });

  describe('getDismissedWarnings', () => {
    it('should return current warning states', () => {
      const { markWarningShown, getDismissedWarnings } =
        useUsageWarningStore.getState();

      const initialState = getDismissedWarnings();
      expect(initialState['85']).toBe(false);
      expect(initialState['95']).toBe(false);

      markWarningShown(85);

      const afterMark = useUsageWarningStore.getState().getDismissedWarnings();
      expect(afterMark['85']).toBe(true);
      expect(afterMark['95']).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { updateUsage, markWarningShown, reset } =
        useUsageWarningStore.getState();

      // Modify state
      updateUsage(42500, 100000);
      markWarningShown(85);
      markWarningShown(95);

      // Reset
      reset();

      const state = useUsageWarningStore.getState();
      expect(state.hasShown85Warning).toBe(false);
      expect(state.hasShown95Warning).toBe(false);
      expect(state.lastWarningTime).toBeNull();
      expect(state.currentUsage).toBe(0);
      expect(state.totalLimit).toBe(50000);
      expect(state.usagePercentage).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero limit gracefully', () => {
      const { updateUsage } = useUsageWarningStore.getState();

      // This would cause division by zero without protection
      updateUsage(1000, 0);

      const state = useUsageWarningStore.getState();
      // Should be Infinity or a very large number
      expect(state.usagePercentage).toBe(Infinity);
    });

    it('should handle negative values', () => {
      const { updateUsage } = useUsageWarningStore.getState();

      updateUsage(-1000, 50000);

      const state = useUsageWarningStore.getState();
      expect(state.currentUsage).toBe(-1000);
      expect(state.usagePercentage).toBe(-2);
    });

    it('should handle large numbers', () => {
      const { updateUsage, shouldShowWarning } =
        useUsageWarningStore.getState();

      updateUsage(850000000, 1000000000); // 85% of 1 billion

      const state = useUsageWarningStore.getState();
      expect(state.usagePercentage).toBe(85);
      expect(shouldShowWarning(85)).toBe(true);
    });
  });
});
