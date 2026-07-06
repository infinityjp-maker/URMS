import type { LoopContinuity } from '@urms/shared';

import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';

const DEFAULT_TIMEZONE = 'Asia/Tokyo';

export function calendarDayKey(date: Date, timeZone = DEFAULT_TIMEZONE): string {
  return date.toLocaleDateString('en-CA', { timeZone });
}

export function resolveLoopContinuity(
  entries: LoopJournalEntry[],
  now = new Date(),
  timeZone = DEFAULT_TIMEZONE,
): LoopContinuity {
  if (entries.length === 0) {
    return 'none';
  }

  const today = calendarDayKey(now, timeZone);
  const latest = entries[entries.length - 1];
  const latestDay = calendarDayKey(latest.at, timeZone);

  if (latestDay === today) {
    return 'looped-today';
  }

  const hasPriorDay = entries.some((entry) => calendarDayKey(entry.at, timeZone) < today);
  return hasPriorDay ? 'new-day' : 'none';
}

/** VT-4 step 5 — ジャーナル SSOT から「昨日 / 今日」の連続 narrative を合成 */
export function synthesizeLoopContinuity(
  entries: LoopJournalEntry[],
  now = new Date(),
  timeZone = DEFAULT_TIMEZONE,
): string | null {
  if (entries.length === 0) {
    return null;
  }

  const today = calendarDayKey(now, timeZone);
  const latest = entries[entries.length - 1];
  const latestDay = calendarDayKey(latest.at, timeZone);

  if (latestDay === today) {
    const time = latest.at.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    });
    const nextPart = latest.next ? ` → 次: ${latest.next}` : '';
    return `今日 ${time} にループ · 完了: ${latest.completed}${nextPart}`;
  }

  const prior = [...entries].reverse().find((entry) => calendarDayKey(entry.at, timeZone) < today);
  if (!prior) {
    return null;
  }

  const priorNext = prior.next ? ` → 次: ${prior.next}` : '';
  return `新しい一日 · 昨日のループ: ${prior.completed}${priorNext}`;
}
