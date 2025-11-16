/**
 * Gradual Rollout System
 *
 * Safely deploy security features with progressive rollout:
 * - Percentage-based rollout (e.g., 10% of users)
 * - A/B testing for security features
 * - Feature flags for quick disable
 * - User group targeting (beta users, admins, etc.)
 * - Monitoring and automatic rollback
 */

export type FeatureFlag =
  | 'prompt_injection_detection'
  | 'api_abuse_prevention'
  | 'rate_limiting'
  | 'token_enforcement'
  | 'html_sanitization';

export interface RolloutConfig {
  enabled: boolean;
  percentage: number; // 0-100
  targetUsers?: string[]; // Specific user IDs
  excludeUsers?: string[]; // Excluded user IDs
  minVersion?: string; // Minimum app version
  maxVersion?: string; // Maximum app version
  startDate?: Date;
  endDate?: Date;
  monitoring?: {
    errorThreshold: number; // % of errors before auto-disable
    checkInterval: number; // Minutes
  };
}

/**
 * Default rollout configurations
 */
const DEFAULT_ROLLOUTS: Record<FeatureFlag, RolloutConfig> = {
  prompt_injection_detection: {
    enabled: true,
    percentage: 100, // Full rollout - critical security
  },

  api_abuse_prevention: {
    enabled: true,
    percentage: 100, // Full rollout - critical security
  },

  rate_limiting: {
    enabled: true,
    percentage: 100, // Full rollout - critical security
  },

  token_enforcement: {
    enabled: true,
    percentage: 100, // Full rollout - critical for revenue
  },

  html_sanitization: {
    enabled: true,
    percentage: 100, // Full rollout - critical security
  },
};

/**
 * In-memory feature flag storage
 * In production, use database or feature flag service (LaunchDarkly, etc.)
 */
const rolloutConfigs: Record<FeatureFlag, RolloutConfig> = {
  ...DEFAULT_ROLLOUTS,
};

/**
 * Error tracking for auto-rollback
 */
const errorTracking = new Map<
  FeatureFlag,
  {
    errors: number;
    requests: number;
    lastCheck: Date;
  }
>();

/**
 * Check if feature is enabled for a user
 */
export function isFeatureEnabled(
  feature: FeatureFlag,
  userId?: string
): boolean {
  const config = rolloutConfigs[feature];

  // Feature globally disabled
  if (!config.enabled) {
    return false;
  }

  // Check date range
  const now = new Date();
  if (config.startDate && now < config.startDate) {
    return false;
  }
  if (config.endDate && now > config.endDate) {
    return false;
  }

  // Check if user is explicitly excluded
  if (userId && config.excludeUsers?.includes(userId)) {
    return false;
  }

  // Check if user is explicitly included
  if (userId && config.targetUsers?.includes(userId)) {
    return true;
  }

  // Percentage-based rollout
  if (config.percentage < 100) {
    if (!userId) {
      // No user ID, use random chance
      return Math.random() * 100 < config.percentage;
    }

    // Deterministic based on user ID (consistent for same user)
    const hash = hashString(userId);
    const bucket = hash % 100;
    return bucket < config.percentage;
  }

  return true;
}

/**
 * Simple string hash for consistent bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Update rollout configuration
 */
export function updateRollout(
  feature: FeatureFlag,
  config: Partial<RolloutConfig>
): void {
  rolloutConfigs[feature] = {
    ...rolloutConfigs[feature],
    ...config,
  };

  console.log(`[Gradual Rollout] Updated ${feature}:`, rolloutConfigs[feature]);
}

/**
 * Enable feature for specific users (beta testing)
 */
export function enableForUsers(feature: FeatureFlag, userIds: string[]): void {
  const config = rolloutConfigs[feature];
  config.targetUsers = [...(config.targetUsers || []), ...userIds];

  console.log(`[Gradual Rollout] Enabled ${feature} for users:`, userIds);
}

/**
 * Disable feature for specific users
 */
export function disableForUsers(feature: FeatureFlag, userIds: string[]): void {
  const config = rolloutConfigs[feature];
  config.excludeUsers = [...(config.excludeUsers || []), ...userIds];

  console.log(`[Gradual Rollout] Disabled ${feature} for users:`, userIds);
}

/**
 * Gradually increase rollout percentage
 */
export function graduateRollout(
  feature: FeatureFlag,
  targetPercentage: number,
  steps: number = 5,
  intervalMinutes: number = 60
): void {
  const config = rolloutConfigs[feature];
  const currentPercentage = config.percentage;

  if (currentPercentage >= targetPercentage) {
    console.log(
      `[Gradual Rollout] ${feature} already at ${currentPercentage}%`
    );
    return;
  }

  const increment = (targetPercentage - currentPercentage) / steps;
  let currentStep = 0;

  const interval = setInterval(
    () => {
      currentStep++;
      const newPercentage = Math.min(
        targetPercentage,
        currentPercentage + increment * currentStep
      );

      updateRollout(feature, { percentage: newPercentage });

      console.log(
        `[Gradual Rollout] ${feature} now at ${newPercentage}% (step ${currentStep}/${steps})`
      );

      if (currentStep >= steps || newPercentage >= targetPercentage) {
        clearInterval(interval);
        console.log(
          `[Gradual Rollout] ${feature} rollout complete at ${newPercentage}%`
        );
      }
    },
    intervalMinutes * 60 * 1000
  );
}

/**
 * Track feature usage/errors for monitoring
 */
export function trackFeatureUsage(
  feature: FeatureFlag,
  success: boolean
): void {
  let tracking = errorTracking.get(feature);

  if (!tracking) {
    tracking = {
      errors: 0,
      requests: 0,
      lastCheck: new Date(),
    };
    errorTracking.set(feature, tracking);
  }

  tracking.requests++;
  if (!success) {
    tracking.errors++;
  }

  // Check if we should auto-disable
  const config = rolloutConfigs[feature];
  if (config.monitoring) {
    const errorRate = (tracking.errors / tracking.requests) * 100;

    if (errorRate > config.monitoring.errorThreshold) {
      console.error(
        `[Gradual Rollout] AUTO-DISABLE: ${feature} error rate ${errorRate.toFixed(2)}% exceeds threshold ${config.monitoring.errorThreshold}%`
      );

      // Auto-disable feature
      updateRollout(feature, { enabled: false });

      // Alert/notify admins
      // TODO: Send alert to monitoring service
    }
  }
}

/**
 * Get all rollout statuses
 */
export function getRolloutStatuses(): Record<
  FeatureFlag,
  {
    config: RolloutConfig;
    stats?: {
      errors: number;
      requests: number;
      errorRate: number;
    };
  }
> {
  const statuses: Record<string, unknown> = {};

  for (const feature of Object.keys(rolloutConfigs) as FeatureFlag[]) {
    const tracking = errorTracking.get(feature);
    statuses[feature] = {
      config: rolloutConfigs[feature],
      stats: tracking
        ? {
            errors: tracking.errors,
            requests: tracking.requests,
            errorRate:
              tracking.requests > 0
                ? (tracking.errors / tracking.requests) * 100
                : 0,
          }
        : undefined,
    };
  }

  return statuses as Record<
    FeatureFlag,
    {
      config: RolloutConfig;
      stats?: {
        errors: number;
        requests: number;
        errorRate: number;
      };
    }
  >;
}

/**
 * Reset error tracking (e.g., after fixing an issue)
 */
export function resetTracking(feature: FeatureFlag): void {
  errorTracking.delete(feature);
  console.log(`[Gradual Rollout] Reset tracking for ${feature}`);
}

/**
 * Emergency kill switch - disable all features
 */
export function emergencyDisableAll(): void {
  console.error('[Gradual Rollout] EMERGENCY: Disabling all features');

  for (const feature of Object.keys(rolloutConfigs) as FeatureFlag[]) {
    updateRollout(feature, { enabled: false });
  }
}

/**
 * Safe feature execution wrapper
 * Automatically tracks errors and can auto-rollback
 */
export async function withFeatureFlag<T>(
  feature: FeatureFlag,
  userId: string | undefined,
  callback: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  // Check if feature is enabled for this user
  if (!isFeatureEnabled(feature, userId)) {
    if (fallback) {
      return fallback();
    }
    throw new Error(`Feature ${feature} not enabled for user`);
  }

  try {
    const result = await callback();
    trackFeatureUsage(feature, true);
    return result;
  } catch (error) {
    trackFeatureUsage(feature, false);

    console.error(`[Gradual Rollout] Error in feature ${feature}:`, error);

    // Try fallback if available
    if (fallback) {
      console.log(`[Gradual Rollout] Using fallback for ${feature}`);
      return fallback();
    }

    throw error;
  }
}

/**
 * Preset rollout strategies
 */
export const ROLLOUT_STRATEGIES = {
  // Conservative: 5% → 10% → 25% → 50% → 100% over 5 hours
  conservative: (feature: FeatureFlag) => {
    updateRollout(feature, { percentage: 5 });
    setTimeout(
      () => updateRollout(feature, { percentage: 10 }),
      60 * 60 * 1000
    );
    setTimeout(
      () => updateRollout(feature, { percentage: 25 }),
      2 * 60 * 60 * 1000
    );
    setTimeout(
      () => updateRollout(feature, { percentage: 50 }),
      3 * 60 * 60 * 1000
    );
    setTimeout(
      () => updateRollout(feature, { percentage: 100 }),
      5 * 60 * 60 * 1000
    );
  },

  // Aggressive: 25% → 50% → 100% over 1 hour
  aggressive: (feature: FeatureFlag) => {
    updateRollout(feature, { percentage: 25 });
    setTimeout(
      () => updateRollout(feature, { percentage: 50 }),
      20 * 60 * 1000
    );
    setTimeout(
      () => updateRollout(feature, { percentage: 100 }),
      60 * 60 * 1000
    );
  },

  // Beta: Only specific users
  beta: (feature: FeatureFlag, userIds: string[]) => {
    updateRollout(feature, { percentage: 0, targetUsers: userIds });
  },

  // Canary: 1% of users for testing
  canary: (feature: FeatureFlag) => {
    updateRollout(feature, { percentage: 1 });
  },
};
