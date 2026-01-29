import React, { useEffect, useState } from 'react';
import {
  type Theme,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  getSystemTheme,
  applyThemeToDocument,
} from './ThemeConstants';
import { ThemeContext } from './ThemeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    return stored || DEFAULT_THEME;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const applyTheme = (newTheme: 'light' | 'dark') => {
      applyThemeToDocument(newTheme);
      setActualTheme(newTheme);
    };

    let mediaQuery: MediaQueryList | null = null;
    let handler: (() => void) | null = null;

    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      handler = () => applyTheme(getSystemTheme());
      mediaQuery.addEventListener('change', handler);
    } else {
      applyTheme(theme);
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Always return cleanup function to remove listener if it was added
    return () => {
      if (mediaQuery && handler) {
        mediaQuery.removeEventListener('change', handler);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
