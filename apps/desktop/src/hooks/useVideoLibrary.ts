import type { VideoLibraryPayload, VideoDetail } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchVideoDetail, fetchVideoLibrary } from '../api/client.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

export type VideoLibraryView = {
  payload: VideoLibraryPayload | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

type Options = {
  readonly apiOnline?: boolean;
};

export function useVideoLibrary(options: Options = {}): VideoLibraryView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const [payload, setPayload] = useState<VideoLibraryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    const data = await fetchVideoLibrary(mode);
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

export function useVideoDetail(videoId: string | null, apiOnline = true) {
  const { mode } = useMode();
  const [detail, setDetail] = useState<VideoDetail | null>(null);

  useEffect(() => {
    if (!apiOnline || !videoId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    void fetchVideoDetail(mode, videoId).then((data) => {
      if (!cancelled) {
        setDetail(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiOnline, videoId, mode]);

  return detail;
}
