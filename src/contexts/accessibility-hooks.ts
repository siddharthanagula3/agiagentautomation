import { useContext } from 'react';
import { AccessibilityContext, type AccessibilityContextType } from './accessibility-context';

export const useAccessibilityContext = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};