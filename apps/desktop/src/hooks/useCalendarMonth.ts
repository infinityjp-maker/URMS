import type { CalendarMonthPayload } from '@urms/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchCalendarMonth } from '../api/client.js';
import { useMode } from '../features/mode/mode-context.js';

const RETRY_MS = 15_000;

function todayDateKey(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export type CalendarMonthView = {
  year: number;
  month: number;
  payload: CalendarMonthPayload | null;
  selectedDateKey: string | null;
  loading: boolean;
  error: boolean;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  selectDate: (dateKey: string) => void;
  refresh: () => Promise<void>;
};

type Options = {
  /** API health が true になるまで取得を待つ（ハブ同期用） */
  readonly apiOnline?: boolean;
};

export function useCalendarMonth(options: Options = {}): CalendarMonthView {
  const { apiOnline = true } = options;
  const { mode } = useMode();
  const initial = currentYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [payload, setPayload] = useState<CalendarMonthPayload | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!apiOnline) {
      setLoading(true);
      setError(true);
      return;
    }

    setLoading(true);
    const data = await fetchCalendarMonth(mode, year, month);
    if (data) {
      setPayload(data);
      setError(false);
      const todayKey = todayDateKey(data.timezone);
      if (data.year === initial.year && data.month === initial.month) {
        setSelectedDateKey((current) => current ?? todayKey);
      }
    } else {
      setPayload(null);
      setError(true);
    }
    setLoading(false);
  }, [apiOnline, mode, year, month, initial.year, initial.month]);

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

  const goPrevMonth = useCallback(() => {
    setSelectedDateKey(null);
    if (month === 1) {
      setYear((value) => value - 1);
      setMonth(12);
      return;
    }
    setMonth((value) => value - 1);
  }, [month]);

  const goNextMonth = useCallback(() => {
    setSelectedDateKey(null);
    if (month === 12) {
      setYear((value) => value + 1);
      setMonth(1);
      return;
    }
    setMonth((value) => value + 1);
  }, [month]);

  const selectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
  }, []);

  return useMemo(
    () => ({
      year,
      month,
      payload,
      selectedDateKey,
      loading,
      error,
      goPrevMonth,
      goNextMonth,
      selectDate,
      refresh,
    }),
    [year, month, payload, selectedDateKey, loading, error, goPrevMonth, goNextMonth, selectDate, refresh],
  );
}
