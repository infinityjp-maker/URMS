import { describe, expect, it } from 'vitest';

import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import {
  resolveLoopContinuity,
  synthesizeLoopContinuity,
} from './synthesize-loop-continuity.js';

const yesterdayEntry: LoopJournalEntry = {
  completed: 'VT-1 task',
  next: 'VT-2 task',
  actorId: 'window-user',
  at: new Date('2026-07-05T17:30:00+09:00'),
};

const todayEntry: LoopJournalEntry = {
  completed: 'VT-2 task',
  actorId: 'window-user',
  at: new Date('2026-07-06T10:00:00+09:00'),
};

describe('synthesizeLoopContinuity', () => {
  it('describes a new day after prior loop', () => {
    expect(
      synthesizeLoopContinuity([yesterdayEntry], new Date('2026-07-06T09:00:00+09:00')),
    ).toBe('新しい一日 · 昨日のループ: VT-1 task');
  });

  it('describes a loop completed today', () => {
    expect(
      synthesizeLoopContinuity([todayEntry], new Date('2026-07-06T12:00:00+09:00')),
    ).toBe('今日 10:00 にループ · 完了: VT-2 task');
  });
});

describe('resolveLoopContinuity', () => {
  it('returns new-day when latest entry is before today', () => {
    expect(resolveLoopContinuity([yesterdayEntry], new Date('2026-07-06T09:00:00+09:00'))).toBe(
      'new-day',
    );
  });

  it('returns looped-today when latest entry is today', () => {
    expect(resolveLoopContinuity([todayEntry], new Date('2026-07-06T12:00:00+09:00'))).toBe(
      'looped-today',
    );
  });
});
