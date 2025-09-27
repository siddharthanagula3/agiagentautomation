import { createContext } from 'react';

export interface AccessibilitySettings {
  // Motion preferences
  prefersReducedMotion: boolean;

  // Visual preferences
  isHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';

  // Focus preferences
  showFocusIndicators: boolean;
  announcePageChanges: boolean;

  // Interaction preferences
  respectSystemPreferences: boolean;

  // Custom settings
  customSettings: Record<string, unknown>;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;

  // Utility methods
  getFontSizeClass: () => string;
  getThemeClass: () => string;
  shouldAnimate: () => boolean;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  prefersReducedMotion: false,
  isHighContrast: false,
  fontSize: 'medium',
  showFocusIndicators: true,
  announcePageChanges: true,
  respectSystemPreferences: true,
  customSettings: {},
};

export const AccessibilityContext = createContext<AccessibilityContextType | null>(null);