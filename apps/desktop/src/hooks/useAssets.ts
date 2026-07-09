import type { AssetDetail, AssetsListPayload, PcPartsPayload } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAssetDetail, fetchAssets, fetchPcParts } from '../api/client.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

export type AssetsView = {
  payload: AssetsListPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useAssets(options: Options = {}): AssetsView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<AssetsListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    const data = await fetchAssets(mode);
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

export type PcPartsView = {
  payload: PcPartsPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

export function usePcParts(options: Options = {}): PcPartsView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<PcPartsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    const data = await fetchPcParts(mode);
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

export function useAssetDetail(assetId: string | null, apiOnline = true) {
  const { mode } = useMode();
  const [detail, setDetail] = useState<AssetDetail | null>(null);

  useEffect(() => {
    if (!apiOnline || !assetId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    void fetchAssetDetail(mode, assetId).then((data) => {
      if (!cancelled) {
        setDetail(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiOnline, assetId, mode]);

  return detail;
}
