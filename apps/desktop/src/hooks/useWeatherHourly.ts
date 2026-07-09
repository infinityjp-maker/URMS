import type { WeatherHourlyPayload } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchWeatherHourly } from '../api/client.js';
import type { DeviceCoords } from '../lib/device-location.js';
import { resolveDeviceLocation } from '../lib/device-location.js';
import { useMode } from '../features/mode/mode-context.js';

export type WeatherHourlyView = {
  payload: WeatherHourlyPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useWeatherHourly(options: Options = {}): WeatherHourlyView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<WeatherHourlyPayload | null>(null);
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

    const data = await fetchWeatherHourly(mode, coords);
    if (data && data.source === 'live') {
      setPayload(data);
      setError(false);
    } else {
      setPayload(data);
      setError(!data || data.slots.length === 0);
    }
    setLoading(false);
  }, [apiOnline, mode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
