import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { UrmsMode } from '@urms/shared';
import { URMS_MODES } from '@urms/shared';

const STORAGE_KEY = 'urms.mode';

interface ModeContextValue {
  mode: UrmsMode;
  setMode: (mode: UrmsMode) => void;
  modes: readonly UrmsMode[];
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

function readStoredMode(): UrmsMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (URMS_MODES as readonly string[]).includes(stored)) {
    return stored as UrmsMode;
  }

  return 'operate';
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UrmsMode>(() => readStoredMode());

  const setMode = (next: UrmsMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      mode,
      setMode,
      modes: URMS_MODES,
    }),
    [mode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }

  return context;
}
