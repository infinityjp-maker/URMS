import { buildDefaultContextDashboard, buildPerceptionState } from '@urms/domain/perception';
import type { PerceptionState } from '@urms/shared';
import { useEffect, useState } from 'react';

import { fetchHealth, fetchPerception, fetchReady } from '../api/client.js';

export type LifeStateSource = 'api' | 'local';

export type LifeStateView = {
  state: PerceptionState;
  source: LifeStateSource;
  apiOnline: boolean;
  dbReady: boolean;
  loading: boolean;
};

const POLL_MS = 60_000;

function fallbackState(): PerceptionState {
  return buildPerceptionState(buildDefaultContextDashboard('operate'));
}
export function useLifeState(): LifeStateView {
  const [view, setView] = useState<LifeStateView>({
    state: fallbackState(),
    source: 'local',
    apiOnline: false,
    dbReady: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [healthOk, readyOk, perception] = await Promise.all([
        fetchHealth(),
        fetchReady(),
        fetchPerception(),
      ]);

      if (cancelled) return;

      if (perception) {
        setView({
          state: perception,
          source: 'api',
          apiOnline: healthOk,
          dbReady: readyOk,
          loading: false,
        });
        return;
      }

      setView({
        state: fallbackState(),
        source: 'local',
        apiOnline: healthOk,
        dbReady: readyOk,
        loading: false,
      });
    }

    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return view;
}
