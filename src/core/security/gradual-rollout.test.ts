/**
 * Gradual Rollout System Tests
 *
 * Tests for feature flag management, percentage-based rollouts,
 * error tracking, and automatic rollback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  updateRollout,
  enableForUsers,
  disableForUsers,
  trackFeatureUsage,
  getRolloutStatuses,
  resetTracking,
  emergencyDisableAll,
  withFeatureFlag,
  ROLLOUT_STRATEGIES,
  type FeatureFlag,
} from './gradual-rollout';

describe('Gradual Rollout System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all features to default state
    const features: FeatureFlag[] = [
      'prompt_injection_detection',
      'api_abuse_prevention',
      'rate_limiting',
      'token_enforcement',
      'html_sanitization',
      'employee_input_sanitization',
      'employee_output_validation',
      'sandwich_defense',
    ];

    features.forEach((feature) => {
      updateRollout(feature, {
        enabled: true,
        percentage: 100,
        targetUsers: undefined,
        excludeUsers: undefined,
        startDate: undefined,
        endDate: undefined,
      });
      resetTracking(feature);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('isFeatureEnabled', () => {
    it('should return true for fully rolled out features', () => {
      expect(isFeatureEnabled('prompt_injection_detection')).toBe(true);
      expect(isFeatureEnabled('api_abuse_prevention')).toBe(true);
      expect(isFeatureEnabled('rate_limiting')).toBe(true);
    });

    it('should return false for disabled features', () => {
      updateRollout('prompt_injection_detection', { enabled: false });
      expect(isFeatureEnabled('prompt_injection_detection')).toBe(false);
    });

    it('should exclude specific users', () => {
      disableForUsers('prompt_injection_detection', ['user-123', 'user-456']);

      expect(isFeatureEnabled('prompt_injection_detection', 'user-123')).toBe(false);
      expect(isFeatureEnabled('prompt_injection_detection', 'user-456')).toBe(false);
      expect(isFeatureEnabled('prompt_injection_detection', 'user-789')).toBe(true);
    });

    it('should include specific target users', () => {
      updateRollout('rate_limiting', { percentage: 0 });
      enableForUsers('rate_limiting', ['beta-user-1', 'beta-user-2']);

      expect(isFeatureEnabled('rate_limiting', 'beta-user-1')).toBe(true);
      expect(isFeatureEnabled('rate_limiting', 'beta-user-2')).toBe(true);
      expect(isFeatureEnabled('rate_limiting', 'regular-user')).toBe(false);
    });

    it('should respect date ranges', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));

      updateRollout('token_enforcement', {
        startDate: new Date('2024-07-01'),
      });

      expect(isFeatureEnabled('token_enforcement')).toBe(false);

      vi.setSystemTime(new Date('2024-07-15'));
      expect(isFeatureEnabled('token_enforcement')).toBe(true);
    });

    it('should respect end date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));

      updateRollout('html_sanitization', {
        endDate: new Date('2024-06-01'),
      });

      expect(isFeatureEnabled('html_sanitization')).toBe(false);
    });

    it('should handle percentage-based rollout deterministically for users', () => {
      updateRollout('api_abuse_prevention', { percentage: 50 });

      // Same user should always get same result
      const userId = 'consistent-user-123';
      const firstResult = isFeatureEnabled('api_abuse_prevention', userId);
      const secondResult = isFeatureEnabled('api_abuse_prevention', userId);
      const thirdResult = isFeatureEnabled('api_abuse_prevention', userId);

      expect(firstResult).toBe(secondResult);
      expect(secondResult).toBe(thirdResult);
    });

    it('should use random chance when no userId provided', () => {
      updateRollout('api_abuse_prevention', { percentage: 50 });

      // Without userId, result is random - just verify it doesn't throw
      expect(() => isFeatureEnabled('api_abuse_prevention')).not.toThrow();
    });
  });

  describe('updateRollout', () => {
    it('should update rollout percentage', () => {
      updateRollout('sandwich_defense', { percentage: 50 });

      const statuses = getRolloutStatuses();
      expect(statuses.sandwich_defense.config.percentage).toBe(50);
    });

    it('should enable/disable feature', () => {
      updateRollout('employee_input_sanitization', { enabled: false });
      expect(isFeatureEnabled('employee_input_sanitization')).toBe(false);

      updateRollout('employee_input_sanitization', { enabled: true });
      expect(isFeatureEnabled('employee_input_sanitization')).toBe(true);
    });

    it('should merge config updates', () => {
      updateRollout('api_abuse_prevention', { percentage: 75 });
      updateRollout('api_abuse_prevention', { targetUsers: ['user-1'] });

      const statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.config.percentage).toBe(75);
      expect(statuses.api_abuse_prevention.config.targetUsers).toContain('user-1');
    });
  });

  describe('enableForUsers / disableForUsers', () => {
    it('should add users to target list', () => {
      enableForUsers('rate_limiting', ['user-a', 'user-b']);

      const statuses = getRolloutStatuses();
      expect(statuses.rate_limiting.config.targetUsers).toContain('user-a');
      expect(statuses.rate_limiting.config.targetUsers).toContain('user-b');
    });

    it('should add users to exclude list', () => {
      disableForUsers('rate_limiting', ['user-x', 'user-y']);

      const statuses = getRolloutStatuses();
      expect(statuses.rate_limiting.config.excludeUsers).toContain('user-x');
      expect(statuses.rate_limiting.config.excludeUsers).toContain('user-y');
    });

    it('should accumulate users across multiple calls', () => {
      enableForUsers('token_enforcement', ['user-1']);
      enableForUsers('token_enforcement', ['user-2']);
      enableForUsers('token_enforcement', ['user-3']);

      const statuses = getRolloutStatuses();
      expect(statuses.token_enforcement.config.targetUsers).toHaveLength(3);
    });
  });

  describe('trackFeatureUsage', () => {
    it('should track successful usage', () => {
      trackFeatureUsage('prompt_injection_detection', true);
      trackFeatureUsage('prompt_injection_detection', true);
      trackFeatureUsage('prompt_injection_detection', true);

      const statuses = getRolloutStatuses();
      expect(statuses.prompt_injection_detection.stats?.requests).toBe(3);
      expect(statuses.prompt_injection_detection.stats?.errors).toBe(0);
    });

    it('should track failed usage', () => {
      trackFeatureUsage('api_abuse_prevention', true);
      trackFeatureUsage('api_abuse_prevention', false);
      trackFeatureUsage('api_abuse_prevention', true);
      trackFeatureUsage('api_abuse_prevention', false);

      const statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.stats?.requests).toBe(4);
      expect(statuses.api_abuse_prevention.stats?.errors).toBe(2);
      expect(statuses.api_abuse_prevention.stats?.errorRate).toBe(50);
    });

    it('should auto-disable when error threshold exceeded', () => {
      // Set monitoring with low threshold
      updateRollout('rate_limiting', {
        monitoring: {
          errorThreshold: 10,
          checkInterval: 5,
        },
      });

      // Generate errors exceeding threshold
      for (let i = 0; i < 10; i++) {
        trackFeatureUsage('rate_limiting', false);
      }

      // Feature should be auto-disabled
      expect(isFeatureEnabled('rate_limiting')).toBe(false);
    });
  });

  describe('getRolloutStatuses', () => {
    it('should return all feature statuses', () => {
      const statuses = getRolloutStatuses();

      expect(statuses.prompt_injection_detection).toBeDefined();
      expect(statuses.api_abuse_prevention).toBeDefined();
      expect(statuses.rate_limiting).toBeDefined();
      expect(statuses.token_enforcement).toBeDefined();
      expect(statuses.html_sanitization).toBeDefined();
      expect(statuses.employee_input_sanitization).toBeDefined();
      expect(statuses.employee_output_validation).toBeDefined();
      expect(statuses.sandwich_defense).toBeDefined();
    });

    it('should include config and stats', () => {
      trackFeatureUsage('prompt_injection_detection', true);

      const statuses = getRolloutStatuses();

      expect(statuses.prompt_injection_detection.config).toBeDefined();
      expect(statuses.prompt_injection_detection.config.enabled).toBe(true);
      expect(statuses.prompt_injection_detection.stats).toBeDefined();
      expect(statuses.prompt_injection_detection.stats?.requests).toBe(1);
    });

    it('should handle features without tracking stats', () => {
      const statuses = getRolloutStatuses();

      // Features without tracking should have undefined stats
      expect(statuses.html_sanitization.stats).toBeUndefined();
    });
  });

  describe('resetTracking', () => {
    it('should reset tracking for a feature', () => {
      trackFeatureUsage('api_abuse_prevention', true);
      trackFeatureUsage('api_abuse_prevention', false);

      let statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.stats?.requests).toBe(2);

      resetTracking('api_abuse_prevention');

      statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.stats).toBeUndefined();
    });
  });

  describe('emergencyDisableAll', () => {
    it('should disable all features', () => {
      emergencyDisableAll();

      expect(isFeatureEnabled('prompt_injection_detection')).toBe(false);
      expect(isFeatureEnabled('api_abuse_prevention')).toBe(false);
      expect(isFeatureEnabled('rate_limiting')).toBe(false);
      expect(isFeatureEnabled('token_enforcement')).toBe(false);
      expect(isFeatureEnabled('html_sanitization')).toBe(false);
      expect(isFeatureEnabled('employee_input_sanitization')).toBe(false);
      expect(isFeatureEnabled('employee_output_validation')).toBe(false);
      expect(isFeatureEnabled('sandwich_defense')).toBe(false);
    });

    it('should log emergency action', () => {
      emergencyDisableAll();

      expect(console.error).toHaveBeenCalledWith(
        '[Gradual Rollout] EMERGENCY: Disabling all features'
      );
    });
  });

  describe('withFeatureFlag', () => {
    it('should execute callback when feature is enabled', async () => {
      const callback = vi.fn().mockResolvedValue('success');

      const result = await withFeatureFlag(
        'prompt_injection_detection',
        'user-123',
        callback
      );

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should throw when feature is disabled without fallback', async () => {
      updateRollout('rate_limiting', { enabled: false });

      const callback = vi.fn().mockResolvedValue('success');

      await expect(
        withFeatureFlag('rate_limiting', 'user-123', callback)
      ).rejects.toThrow('Feature rate_limiting not enabled for user');
    });

    it('should use fallback when feature is disabled', async () => {
      updateRollout('rate_limiting', { enabled: false });

      const callback = vi.fn().mockResolvedValue('main');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFeatureFlag(
        'rate_limiting',
        'user-123',
        callback,
        fallback
      );

      expect(callback).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
      expect(result).toBe('fallback');
    });

    it('should track successful execution', async () => {
      const callback = vi.fn().mockResolvedValue('success');

      await withFeatureFlag('api_abuse_prevention', 'user-123', callback);

      const statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.stats?.requests).toBe(1);
      expect(statuses.api_abuse_prevention.stats?.errors).toBe(0);
    });

    it('should track failed execution', async () => {
      const callback = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');

      await withFeatureFlag(
        'api_abuse_prevention',
        'user-123',
        callback,
        fallback
      );

      const statuses = getRolloutStatuses();
      expect(statuses.api_abuse_prevention.stats?.errors).toBe(1);
    });

    it('should use fallback on callback error', async () => {
      const callback = vi.fn().mockRejectedValue(new Error('Main failed'));
      const fallback = vi.fn().mockResolvedValue('recovered');

      const result = await withFeatureFlag(
        'token_enforcement',
        'user-123',
        callback,
        fallback
      );

      expect(result).toBe('recovered');
      expect(console.log).toHaveBeenCalledWith(
        '[Gradual Rollout] Using fallback for token_enforcement'
      );
    });

    it('should rethrow error when no fallback provided', async () => {
      const callback = vi.fn().mockRejectedValue(new Error('Critical error'));

      await expect(
        withFeatureFlag('html_sanitization', 'user-123', callback)
      ).rejects.toThrow('Critical error');
    });
  });

  describe('ROLLOUT_STRATEGIES', () => {
    it('should have conservative strategy', () => {
      expect(ROLLOUT_STRATEGIES.conservative).toBeDefined();
      expect(typeof ROLLOUT_STRATEGIES.conservative).toBe('function');
    });

    it('should have aggressive strategy', () => {
      expect(ROLLOUT_STRATEGIES.aggressive).toBeDefined();
      expect(typeof ROLLOUT_STRATEGIES.aggressive).toBe('function');
    });

    it('should have beta strategy', () => {
      expect(ROLLOUT_STRATEGIES.beta).toBeDefined();
      expect(typeof ROLLOUT_STRATEGIES.beta).toBe('function');
    });

    it('should have canary strategy', () => {
      expect(ROLLOUT_STRATEGIES.canary).toBeDefined();
      expect(typeof ROLLOUT_STRATEGIES.canary).toBe('function');
    });

    it('should apply beta strategy correctly', () => {
      ROLLOUT_STRATEGIES.beta('employee_input_sanitization', ['beta-1', 'beta-2']);

      const statuses = getRolloutStatuses();
      expect(statuses.employee_input_sanitization.config.percentage).toBe(0);
      expect(statuses.employee_input_sanitization.config.targetUsers).toContain('beta-1');
      expect(statuses.employee_input_sanitization.config.targetUsers).toContain('beta-2');
    });

    it('should apply canary strategy correctly', () => {
      ROLLOUT_STRATEGIES.canary('sandwich_defense');

      const statuses = getRolloutStatuses();
      expect(statuses.sandwich_defense.config.percentage).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined userId', () => {
      expect(() => isFeatureEnabled('prompt_injection_detection', undefined)).not.toThrow();
    });

    it('should handle empty userId', () => {
      expect(() => isFeatureEnabled('prompt_injection_detection', '')).not.toThrow();
    });

    it('should handle hash collisions gracefully', () => {
      // Different users might hash to same bucket
      updateRollout('api_abuse_prevention', { percentage: 1 });

      let enabledCount = 0;
      for (let i = 0; i < 100; i++) {
        if (isFeatureEnabled('api_abuse_prevention', `user-${i}`)) {
          enabledCount++;
        }
      }

      // With 1% rollout, should be roughly 1 user enabled (allow some variance)
      expect(enabledCount).toBeLessThanOrEqual(5);
    });

    it('should handle concurrent tracking updates', () => {
      // Simulate concurrent tracking
      for (let i = 0; i < 1000; i++) {
        trackFeatureUsage('rate_limiting', i % 10 !== 0); // 10% error rate
      }

      const statuses = getRolloutStatuses();
      expect(statuses.rate_limiting.stats?.requests).toBe(1000);
      expect(statuses.rate_limiting.stats?.errors).toBe(100);
      expect(statuses.rate_limiting.stats?.errorRate).toBe(10);
    });
  });
});
