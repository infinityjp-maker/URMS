import type { TransportDeparturePayload } from '@urms/shared';
import { useCallback, useEffect, useState } from 'react';

import { fetchTransportDeparture } from '../api/client.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

export type TransportDepartureView = {
  payload: TransportDeparturePayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useTransportDeparture(options: Options = {}): TransportDepartureView {
  const { mode } = useMode();
  const [payload, setPayload] = useState<TransportDeparturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (options.apiOnline === false) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    const data = await fetchTransportDeparture(mode);
    if (!data) {
      setError(true);
      setPayload(null);
    } else {
      setPayload(data);
    }
    setLoading(false);
  }, [mode, options.apiOnline]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (options.apiOnline !== true || !error) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, RETRY_MS);

    return () => window.clearInterval(timer);
  }, [error, options.apiOnline, refresh]);

  return { payload, loading, error, refresh };
}
