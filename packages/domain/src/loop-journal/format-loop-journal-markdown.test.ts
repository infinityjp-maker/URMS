import { describe, expect, it } from 'vitest';

import type { LoopJournalEntry } from './loop-journal-service.js';
import { formatLoopJournalLine, formatLoopJournalMarkdown } from './format-loop-journal-markdown.js';

describe('formatLoopJournalMarkdown', () => {
  const entry: LoopJournalEntry = {
    completed: 'VT-1 task',
    next: 'VT-2 task',
    actorId: 'window-user',
    at: new Date('2026-07-06T10:00:00+09:00'),
  };

  it('formats a single journal line', () => {
    expect(formatLoopJournalLine(entry)).toBe(
      '- 2026/7/6 10:00 · 完了: VT-1 task → 次: VT-2 task (window-user)',
    );
  });

  it('includes export header and entries', () => {
    const markdown = formatLoopJournalMarkdown([entry]);
    expect(markdown).toContain('正本は loop-entry Resource（DB）');
    expect(markdown).toContain('VT-1 task');
  });
});
