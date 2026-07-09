import type { StorageOverviewPayload, StorageVolumeDetail } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchStorageOverview, fetchStorageVolume } from '../api/client.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

export type StorageOverviewView = {
  payload: StorageOverviewPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useStorageOverview(options: Options = {}): StorageOverviewView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<StorageOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    const data = await fetchStorageOverview(mode);
    if (data) {
      setPayload(data);
      setError(false);
    } else {
      setPayload(null);
      setError(true);
    }
    setLoading(false);
  }, [apiOnline, mode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!apiOnline || !error) {
      return;
    }

    const id = window.setInterval(() => {
      void refresh();
    }, RETRY_MS);

    return () => window.clearInterval(id);
  }, [apiOnline, error, refresh]);

  return useMemo(
    () => ({
      payload,
      loading,
      error,
      refresh,
    }),
    [payload, loading, error, refresh],
  );
}

export function useStorageVolume(volumeId: string | null, apiOnline = true) {
  const { mode } = useMode();
  const [detail, setDetail] = useState<StorageVolumeDetail | null>(null);

  useEffect(() => {
    if (!apiOnline || !volumeId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    void fetchStorageVolume(mode, volumeId).then((data) => {
      if (!cancelled) {
        setDetail(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiOnline, volumeId, mode]);

  return detail;
}
