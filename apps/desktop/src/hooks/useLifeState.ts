import { buildDefaultContextDashboard, buildPerceptionState, canAdvancePerceptionState } from '@urms/domain/perception';
import type { PerceptionState } from '@urms/shared';
import { useCallback, useEffect, useState } from 'react';

import { advanceContextTask, fetchHealth, fetchPerception, fetchReady } from '../api/client.js';

export type LifeStateSource = 'api' | 'local';

export type LifeStateView = {
  state: PerceptionState;
  source: LifeStateSource;
  apiOnline: boolean;
  dbReady: boolean;
  loading: boolean;
  canAdvanceTask: boolean;
  advancing: boolean;
  advanceError: string | null;
  advanceSuccess: string | null;
  refresh: () => Promise<void>;
  advanceTask: () => Promise<boolean>;
};

const POLL_MS = 60_000;

function fallbackState(): PerceptionState {
  return buildPerceptionState(buildDefaultContextDashboard('operate'));
}

export function useLifeState(): LifeStateView {
  const [view, setView] = useState<Omit<LifeStateView, 'refresh' | 'advanceTask'>>({
    state: fallbackState(),
    source: 'local',
    apiOnline: false,
    dbReady: false,
    loading: true,
    canAdvanceTask: canAdvancePerceptionState(buildPerceptionState(buildDefaultContextDashboard('operate'))),
    advancing: false,
    advanceError: null,
    advanceSuccess: null,
  });

  const refresh = useCallback(async () => {
    const [healthOk, readyOk, perception] = await Promise.all([
      fetchHealth(),
      fetchReady(),
      fetchPerception(),
    ]);

    if (perception) {
      setView((current) => ({
        ...current,
        state: perception,
        source: 'api',
        apiOnline: healthOk,
        dbReady: readyOk,
        loading: false,
        canAdvanceTask: readyOk && canAdvancePerceptionState(perception),
        advanceError: null,
        advanceSuccess: current.advanceSuccess,
      }));
      return;
    }

    const localState = fallbackState();
    setView((current) => ({
      ...current,
      state: localState,
      source: 'local',
      apiOnline: healthOk,
      dbReady: readyOk,
      loading: false,
      canAdvanceTask: canAdvancePerceptionState(localState),
      advanceError: null,
      advanceSuccess: current.advanceSuccess,
    }));
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const advanceTask = useCallback(async () => {
    setView((current) => ({ ...current, advancing: true, advanceError: null, advanceSuccess: null }));

    const ok = await advanceContextTask();
    if (!ok) {
      setView((current) => ({
        ...current,
        advancing: false,
        advanceError: '更新できませんでした（API · DB を確認）',
      }));
      return false;
    }

    await refresh();
    setView((current) => ({
      ...current,
      advancing: false,
      advanceSuccess: 'Context 更新 · 次のフォーカスに切り替えました',
    }));

    window.setTimeout(() => {
      setView((current) => ({ ...current, advanceSuccess: null }));
    }, 4000);

    return true;
  }, [refresh]);

  return { ...view, refresh, advanceTask };
}
