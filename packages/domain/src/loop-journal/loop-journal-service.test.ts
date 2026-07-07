import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import { extractLoopJournalEntry, createLoopJournalService, type LoopJournalEntry } from './loop-journal-service.js';

describe('extractLoopJournalEntry', () => {
  it('captures completed and next task summaries', () => {
    const before = buildDefaultContextDashboard('operate');
    const after = buildDefaultContextDashboard('operate');
    after.items = after.items.map((item) =>
      item.key === 'current_task'
        ? { ...item, summary: 'VT-4 — 日次ループ narrative · journal 連続性' }
        : item,
    );

    const entry = extractLoopJournalEntry(
      before,
      after,
      'window-user',
      new Date('2026-07-06T10:00:00+09:00'),
    );

    expect(entry).toEqual({
      completed: 'VT-2 — Context 脳（地点 · グラフ · 時間から「今」を合成）',
      next: 'VT-4 — 日次ループ narrative · journal 連続性',
      actorId: 'window-user',
      at: new Date('2026-07-06T10:00:00+09:00'),
    });
  });

  it('returns null when current_task did not change', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    expect(extractLoopJournalEntry(dashboard, dashboard, 'window-user')).toBeNull();
  });

  it('reads recent entries from journal file', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-'));
    const journalPath = path.join(repoRoot, '.cursor/resources/loop/journal.md');
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      '- 2026/7/6 10:00 · 完了: VT-1 task → 次: VT-2 task (window-user)\n',
      'utf8',
    );

    const service = createLoopJournalService({ repoRoot });
    const entries = await service.readRecent();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.completed).toBe('VT-1 task');
    expect(entries[0]?.next).toBe('VT-2 task');

    const raw = await readFile(journalPath, 'utf8');
    expect(raw).toContain('VT-1 task');
  });

  it('calls persistLoopEntry after append when configured', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-persist-'));
    const before = buildDefaultContextDashboard('operate');
    const after = buildDefaultContextDashboard('operate');
    after.items = after.items.map((item) =>
      item.key === 'current_task'
        ? { ...item, summary: 'VT-4 — 日次ループ narrative · journal 連続性' }
        : item,
    );

    const persisted: Array<{ entry: LoopJournalEntry; mode: string }> = [];
    const service = createLoopJournalService({
      repoRoot,
      persistLoopEntry: async (entry, _actorId, mode) => {
        persisted.push({ entry, mode });
      },
    });

    const recorded = await service.recordAdvance(before, after, 'window-user', 'operate');

    expect(recorded?.completed).toContain('VT-2');
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.mode).toBe('operate');
    expect(persisted[0]?.entry.next).toContain('VT-4');
  });
});
