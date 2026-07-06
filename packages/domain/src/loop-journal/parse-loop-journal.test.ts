import { describe, expect, it } from 'vitest';

import { parseLoopJournalMarkdown } from './parse-loop-journal.js';

describe('parseLoopJournalMarkdown', () => {
  it('parses journal lines in chronological order', () => {
    const raw = `# header

- 2026/7/5 17:30 · 完了: VT-1 task → 次: VT-2 task (window-user)
- 2026/7/6 10:00 · 完了: VT-2 task (window-user)
`;

    expect(parseLoopJournalMarkdown(raw)).toEqual([
      {
        completed: 'VT-1 task',
        next: 'VT-2 task',
        actorId: 'window-user',
        at: new Date(2026, 6, 5, 17, 30, 0, 0),
      },
      {
        completed: 'VT-2 task',
        actorId: 'window-user',
        at: new Date(2026, 6, 6, 10, 0, 0, 0),
      },
    ]);
  });

  it('ignores malformed lines', () => {
    expect(parseLoopJournalMarkdown('- not a journal line\n')).toEqual([]);
  });
});
