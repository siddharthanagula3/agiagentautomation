import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import { HighContrastDetector, MotionPreferences } from '../lib/accessibility';
import { AccessibilityContext, DEFAULT_SETTINGS, type AccessibilitySettings, type AccessibilityContextType } from './accessibility-context';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load settings from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessibility-settings');
      if (stored) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Update settings when system preferences change
  useEffect(() => {
    if (!settings.respectSystemPreferences) return;

    // Monitor high contrast changes
    const cleanupHighContrast = HighContrastDetector.onHighContrastChange((isHighContrast) => {
      setSettings(prev => ({ ...prev, isHighContrast }));
    });

    // Monitor motion preference changes
    const cleanupMotion = MotionPreferences.onMotionPreferenceChange((prefersReducedMotion) => {
      setSettings(prev => ({ ...prev, prefersReducedMotion }));
    });

    // Initialize with current system preferences
    setSettings(prev => ({
      ...prev,
      isHighContrast: HighContrastDetector.isHighContrastMode(),
      prefersReducedMotion: MotionPreferences.prefersReducedMotion(),
    }));

    return () => {
      cleanupHighContrast();
      cleanupMotion();
    };
  }, [settings.respectSystemPreferences]);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply font size class
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(getFontSizeClass());

    // Apply high contrast class
    root.classList.toggle('high-contrast', settings.isHighContrast);

    // Apply reduced motion class
    root.classList.toggle('reduce-motion', settings.prefersReducedMotion);

    // Apply focus indicators class
    root.classList.toggle('show-focus-indicators', settings.showFocusIndicators);
  }, [settings, getFontSizeClass]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const getFontSizeClass = useCallback(() => {
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  }, [settings.fontSize]);

  const getThemeClass = () => {
    return settings.isHighContrast ? 'high-contrast-theme' : '';
  };

  const shouldAnimate = () => {
    return !settings.prefersReducedMotion;
  };

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    resetSettings,
    getFontSizeClass,
    getThemeClass,
    shouldAnimate,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export { AccessibilityProvider };