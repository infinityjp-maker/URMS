import React from 'react';
import { useTheme } from './ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === 'future') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('future');
  };

  const label = theme === 'future' ? 'Neon' : theme === 'dark' ? 'Dark' : 'Light';

  return (
    <button
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={cycle}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--header-text)',
        padding: '6px 10px',
        borderRadius: 8,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
};

export default ThemeToggle;
