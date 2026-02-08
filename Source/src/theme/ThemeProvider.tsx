import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'future' | 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('urms-theme') : null;
    if (saved === 'light' || saved === 'dark' || saved === 'future') return saved as Theme;
    return 'future';
  });

  useEffect(() => {
    // Apply body classes for theme (keep backward compatibility)
    const classesToRemove = ['dark-theme', 'light-theme', 'theme-dark', 'theme-light', 'theme-neon', 'future-theme'];
    classesToRemove.forEach(c => document.body.classList.remove(c));

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.add('theme-dark');
    } else if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.add('theme-light');
    } else if (theme === 'future') {
      // 'future' maps to neon/holographic look
      document.body.classList.add('theme-neon');
      document.body.classList.add('future-theme');
      // new canonical future class
      document.body.classList.add('theme-future');
    }

    try {
      localStorage.setItem('urms-theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeProvider;
