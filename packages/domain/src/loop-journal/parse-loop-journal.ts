import type { LoopJournalEntry } from './loop-journal-service.js';

const JOURNAL_LINE =
  /^- (\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}) · 完了: (.+) \(([^)]+)\)$/;

function parseJournalStamp(stamp: string): Date | null {
  const match = stamp.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );
}

function parseCompletedAndNext(body: string): Pick<LoopJournalEntry, 'completed' | 'next'> {
  const nextMarker = ' → 次: ';
  const nextIndex = body.indexOf(nextMarker);
  if (nextIndex === -1) {
    return { completed: body };
  }

  return {
    completed: body.slice(0, nextIndex),
    next: body.slice(nextIndex + nextMarker.length),
  };
}

/** journal.md の箇条書き行を LoopJournalEntry に変換（時系列） */
export function parseLoopJournalMarkdown(raw: string): LoopJournalEntry[] {
  const entries: LoopJournalEntry[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) {
      continue;
    }

    const match = trimmed.match(JOURNAL_LINE);
    if (!match) {
      continue;
    }

    const [, stamp, body, actorId] = match;
    const at = parseJournalStamp(stamp);
    if (!at) {
      continue;
    }

    entries.push({
      ...parseCompletedAndNext(body),
      actorId,
      at,
    });
  }

  return entries;
}
