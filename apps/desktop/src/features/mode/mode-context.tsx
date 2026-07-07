import type { UrmsMode } from '@urms/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchAvailableModes } from '../../api/client.js';
import { DESKTOP_CORE_MODES } from '../../lib/urms-modes.js';

const STORAGE_KEY = 'urms.mode';

interface ModeContextValue {
  mode: UrmsMode;
  setMode: (mode: UrmsMode) => void;
  modes: readonly UrmsMode[];
  modesLoading: boolean;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

function isStoredMode(value: string): value is UrmsMode {
  return value === 'plan' || value === 'operate' || value === 'audit' || value === 'develop';
}

function readStoredMode(): UrmsMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isStoredMode(stored)) {
    return stored;
  }

  return 'operate';
}

function normalizeMode(current: UrmsMode, available: readonly UrmsMode[]): UrmsMode {
  if (available.includes(current)) {
    return current;
  }

  return 'operate';
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UrmsMode>(() => readStoredMode());
  const [modes, setModes] = useState<readonly UrmsMode[]>(DESKTOP_CORE_MODES);
  const [modesLoading, setModesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetchAvailableModes('operate')
      .then((available) => {
        if (cancelled) {
          return;
        }

        setModes(available);
        setModeState((current) => normalizeMode(current, available));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setModes(DESKTOP_CORE_MODES);
        setModeState((current) => (current === 'develop' ? 'operate' : current));
      })
      .finally(() => {
        if (!cancelled) {
          setModesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: UrmsMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      mode,
      setMode,
      modes,
      modesLoading,
    }),
    [mode, modes, modesLoading],
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
