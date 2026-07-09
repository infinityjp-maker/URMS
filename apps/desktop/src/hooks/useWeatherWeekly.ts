import type { WeatherWeeklyPayload } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchWeatherWeekly } from '../api/client.js';
import type { DeviceCoords } from '../lib/device-location.js';
import { resolveDeviceLocation } from '../lib/device-location.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

export type WeatherWeeklyView = {
  payload: WeatherWeeklyPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useWeatherWeekly(options: Options = {}): WeatherWeeklyView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<WeatherWeeklyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    let coords: DeviceCoords | null = null;
    try {
      coords = await resolveDeviceLocation();
    } catch {
      coords = null;
    }

    const data = await fetchWeatherWeekly(mode, coords);
    if (data && data.source === 'live') {
      setPayload(data);
      setError(false);
    } else {
      setPayload(data);
      setError(!data || data.days.length === 0);
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
