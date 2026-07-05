import { useEffect, useState } from 'react';

type ClockState = {
  time: string;
  weekday: string;
  dateLabel: string;
};

function formatClock(now: Date): ClockState {
  const time = now.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const weekday = now.toLocaleDateString('ja-JP', { weekday: 'short' });
  const monthDay = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

  return {
    time,
    weekday,
    dateLabel: monthDay,
  };
}

export function useClock(tickMs = 30_000): ClockState {
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    setClock(formatClock(new Date()));
    const id = window.setInterval(() => setClock(formatClock(new Date())), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return clock;
}
