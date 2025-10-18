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

    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme(getSystemTheme());
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
