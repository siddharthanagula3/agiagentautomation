/**
 * Global Settings Store Tests
 *
 * Tests for the global app state management including settings,
 * feature flags, and session management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from './global-settings-store';
import type { AppSettings, AppState } from './global-settings-store';

// Counter for unique IDs
let idCounter = 0;

describe('Global Settings Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().reset();
    vi.useFakeTimers();
    // Reset counter
    idCounter = 0;
    // Mock crypto.randomUUID with incrementing counter
    vi.stubGlobal('crypto', {
      randomUUID: () => `test-uuid-${++idCounter}`,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAppStore.getState();

      expect(state.initialized).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.lastActivity).toBeNull();
    });

    it('should have default settings', () => {
      const state = useAppStore.getState();

      expect(state.settings.theme).toBe('system');
      expect(state.settings.language).toBe('en');
      expect(state.settings.autoSave).toBe(true);
      expect(state.settings.notifications.desktop).toBe(true);
      expect(state.settings.notifications.sound).toBe(true);
      expect(state.settings.notifications.email).toBe(false);
      expect(state.settings.privacy.analytics).toBe(true);
      expect(state.settings.privacy.crashReporting).toBe(true);
      expect(state.settings.privacy.dataSharing).toBe(false);
    });

    it('should have default feature flags', () => {
      const state = useAppStore.getState();

      expect(state.features.betaFeatures).toBe(false);
      expect(state.features.advancedAnalytics).toBe(true);
      expect(state.features.experimentalUI).toBe(false);
      expect(state.features.voiceMode).toBe(true);
      expect(state.features.realTimeCollab).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize app state', async () => {
      const initPromise = useAppStore.getState().initialize();

      // After calling initialize, loading should be true
      // (need to check store state, not the captured reference)
      expect(useAppStore.getState().loading).toBe(true);

      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(1000);
      await initPromise;

      const newState = useAppStore.getState();
      expect(newState.initialized).toBe(true);
      expect(newState.loading).toBe(false);
      expect(newState.sessionId).not.toBeNull();
      expect(newState.lastActivity).not.toBeNull();
    });

    it('should set loading state during initialization', () => {
      const { setLoading } = useAppStore.getState();

      setLoading(true);
      expect(useAppStore.getState().loading).toBe(true);

      setLoading(false);
      expect(useAppStore.getState().loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { setError } = useAppStore.getState();

      setError('Test error message');
      expect(useAppStore.getState().error).toBe('Test error message');

      setError(null);
      expect(useAppStore.getState().error).toBeNull();
    });

    it('should handle empty string as error', () => {
      const { setError } = useAppStore.getState();

      setError('');
      expect(useAppStore.getState().error).toBe('');
    });
  });

  describe('Settings Management', () => {
    it('should update theme setting', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({ theme: 'dark' });
      expect(useAppStore.getState().settings.theme).toBe('dark');

      updateSettings({ theme: 'light' });
      expect(useAppStore.getState().settings.theme).toBe('light');
    });

    it('should update language setting', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({ language: 'es' });
      expect(useAppStore.getState().settings.language).toBe('es');
    });

    it('should update nested notification settings', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({
        notifications: {
          desktop: false,
          sound: false,
          email: true,
        },
      });

      const settings = useAppStore.getState().settings;
      expect(settings.notifications.desktop).toBe(false);
      expect(settings.notifications.sound).toBe(false);
      expect(settings.notifications.email).toBe(true);
    });

    it('should update privacy settings', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({
        privacy: {
          analytics: false,
          crashReporting: false,
          dataSharing: true,
        },
      });

      const settings = useAppStore.getState().settings;
      expect(settings.privacy.analytics).toBe(false);
      expect(settings.privacy.crashReporting).toBe(false);
      expect(settings.privacy.dataSharing).toBe(true);
    });

    it('should update performance settings', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({
        performance: {
          reducedMotion: true,
          lowQualityImages: true,
          preloadContent: false,
        },
      });

      const settings = useAppStore.getState().settings;
      expect(settings.performance.reducedMotion).toBe(true);
      expect(settings.performance.lowQualityImages).toBe(true);
      expect(settings.performance.preloadContent).toBe(false);
    });

    it('should handle partial settings update', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({ autoSave: false });

      const settings = useAppStore.getState().settings;
      expect(settings.autoSave).toBe(false);
      // Other settings should remain unchanged
      expect(settings.theme).toBe('system');
      expect(settings.language).toBe('en');
    });

    it('should reset settings to defaults', () => {
      const { updateSettings, resetSettings } = useAppStore.getState();

      // Change some settings
      updateSettings({
        theme: 'dark',
        language: 'fr',
        autoSave: false,
      });

      // Reset
      resetSettings();

      const settings = useAppStore.getState().settings;
      expect(settings.theme).toBe('system');
      expect(settings.language).toBe('en');
      expect(settings.autoSave).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should start a new session', () => {
      const { startSession } = useAppStore.getState();

      startSession();

      const state = useAppStore.getState();
      expect(state.sessionId).not.toBeNull();
      expect(state.lastActivity).not.toBeNull();
    });

    it('should end session', () => {
      const { startSession, endSession } = useAppStore.getState();

      startSession();
      expect(useAppStore.getState().sessionId).not.toBeNull();

      endSession();

      const state = useAppStore.getState();
      expect(state.sessionId).toBeNull();
      expect(state.lastActivity).toBeNull();
    });

    it('should update activity timestamp', () => {
      const { startSession, updateActivity } = useAppStore.getState();

      startSession();
      const initialActivity = useAppStore.getState().lastActivity;

      vi.advanceTimersByTime(1000);
      updateActivity();

      const newActivity = useAppStore.getState().lastActivity;
      expect(newActivity).not.toEqual(initialActivity);
    });

    it('should handle update activity without active session', () => {
      const { updateActivity } = useAppStore.getState();

      // Should not throw even without active session
      expect(() => updateActivity()).not.toThrow();
    });
  });

  describe('Feature Flags', () => {
    it('should set feature flag to true', () => {
      const { setFeature, isFeatureEnabled } = useAppStore.getState();

      setFeature('betaFeatures', true);
      expect(isFeatureEnabled('betaFeatures')).toBe(true);
    });

    it('should set feature flag to false', () => {
      const { setFeature, isFeatureEnabled } = useAppStore.getState();

      setFeature('advancedAnalytics', false);
      expect(isFeatureEnabled('advancedAnalytics')).toBe(false);
    });

    it('should handle new feature flags', () => {
      const { setFeature, isFeatureEnabled } = useAppStore.getState();

      setFeature('newFeature', true);
      expect(isFeatureEnabled('newFeature')).toBe(true);
    });

    it('should return false for undefined feature flags', () => {
      const { isFeatureEnabled } = useAppStore.getState();

      expect(isFeatureEnabled('nonExistentFeature')).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', () => {
      const { updateSettings, setFeature, startSession, setError, reset } =
        useAppStore.getState();

      // Modify various state
      updateSettings({ theme: 'dark' });
      setFeature('betaFeatures', true);
      startSession();
      setError('Test error');

      // Reset
      reset();

      const state = useAppStore.getState();
      expect(state.initialized).toBe(false);
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.settings.theme).toBe('system');
      expect(state.features.betaFeatures).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid sequential updates', () => {
      const { updateSettings } = useAppStore.getState();

      updateSettings({ theme: 'dark' });
      updateSettings({ theme: 'light' });
      updateSettings({ theme: 'system' });

      expect(useAppStore.getState().settings.theme).toBe('system');
    });

    it('should handle multiple session starts', () => {
      const { startSession } = useAppStore.getState();

      startSession();
      const firstSessionId = useAppStore.getState().sessionId;

      startSession();
      const secondSessionId = useAppStore.getState().sessionId;

      // Should create new session ID each time
      expect(secondSessionId).not.toBe(firstSessionId);
    });

    it('should preserve state across multiple updates', () => {
      const { updateSettings, setFeature } = useAppStore.getState();

      updateSettings({ theme: 'dark' });
      setFeature('betaFeatures', true);
      updateSettings({ language: 'fr' });

      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.language).toBe('fr');
      expect(state.features.betaFeatures).toBe(true);
    });
  });
});
