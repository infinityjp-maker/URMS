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
    // Apply body class for theme
    document.body.classList.remove('dark-theme', 'light-theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    else if (theme === 'light') document.body.classList.add('light-theme');

    try {
      localStorage.setItem('urms-theme', theme === 'future' ? '' : theme);
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
