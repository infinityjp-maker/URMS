import { buildDefaultContextDashboard, buildPerceptionMeta, buildPerceptionState } from '@urms/domain/perception';
import type { PerceptionMeta, PerceptionState } from '@urms/shared';
import { useCallback, useEffect, useState } from 'react';

import { advanceContextTask, fetchHealth, fetchPerception, fetchReady } from '../api/client.js';
import { resolveDeviceLocation } from '../lib/device-location.js';

export type LifeStateSource = 'api' | 'local';

export type LifeStateView = {
  state: PerceptionState;
  source: LifeStateSource;
  apiOnline: boolean;
  dbReady: boolean;
  loading: boolean;
  canAdvanceTask: boolean;
  sources: PerceptionMeta['sources'] | null;
  advancing: boolean;
  advanceError: string | null;
  advanceSuccess: string | null;
  refresh: () => Promise<void>;
  advanceTask: () => Promise<boolean>;
};

const POLL_MS = 60_000;

function fallbackView(): Omit<LifeStateView, 'refresh' | 'advanceTask'> {
  const dashboard = buildDefaultContextDashboard('operate');
  const state = buildPerceptionState(dashboard);
  const meta = buildPerceptionMeta(dashboard, state);

  return {
    state,
    source: 'local',
    apiOnline: false,
    dbReady: false,
    loading: true,
    canAdvanceTask: meta.canAdvanceTask,
    sources: meta.sources,
    advancing: false,
    advanceError: null,
    advanceSuccess: null,
  };
}

export function useLifeState(): LifeStateView {
  const [view, setView] = useState<Omit<LifeStateView, 'refresh' | 'advanceTask'>>(fallbackView);

  const refresh = useCallback(async () => {
    const deviceCoords = await resolveDeviceLocation();
    const [healthOk, readyOk, perception] = await Promise.all([
      fetchHealth(),
      fetchReady(),
      fetchPerception(deviceCoords),
    ]);

    if (perception) {
      setView((current) => ({
        ...current,
        state: perception.data,
        source: 'api',
        apiOnline: healthOk,
        dbReady: readyOk,
        loading: false,
        canAdvanceTask: readyOk && perception.meta.canAdvanceTask,
        sources: perception.meta.sources,
        advanceError: null,
        advanceSuccess: current.advanceSuccess,
      }));
      return;
    }

    const localDashboard = buildDefaultContextDashboard('operate');
    const localState = buildPerceptionState(localDashboard);
    const localMeta = buildPerceptionMeta(localDashboard, localState);
    setView((current) => ({
      ...current,
      state: localState,
      source: 'local',
      apiOnline: healthOk,
      dbReady: readyOk,
      loading: false,
      canAdvanceTask: localMeta.canAdvanceTask,
      sources: localMeta.sources,
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
