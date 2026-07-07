import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { fromLoopEntryResource } from './loop-entry-resource.js';
import {
  createCompositeLoopJournalReader,
  mergeLoopJournalEntries,
  readLoopJournalFromFile,
} from './loop-journal-repository.js';
import type { LoopJournalEntry } from './loop-journal-service.js';
import { LOOP_JOURNAL_PATH } from './loop-journal-service.js';

function buildEntry(at: string, completed: string, next?: string): LoopJournalEntry {
  return {
    completed,
    next,
    actorId: 'window-user',
    at: new Date(at),
  };
}

function buildResource(entry: LoopJournalEntry): ResourceEntity {
  return {
    resourceType: 'loop-entry',
    resourceId: `loop:${entry.at.toISOString()}`,
    name: entry.completed,
    status: 'active',
    metadata: {
      completed: entry.completed,
      ...(entry.next ? { next: entry.next } : {}),
      actorId: entry.actorId,
      occurredAt: entry.at.toISOString(),
    },
    createdAt: entry.at.toISOString(),
    updatedAt: entry.at.toISOString(),
  };
}

describe('mergeLoopJournalEntries', () => {
  it('merges file history with resource entries and prefers resource on duplicate key', () => {
    const fileOnly = buildEntry('2026-07-05T01:00:00.000Z', 'VT-1 task');
    const sharedAt = '2026-07-06T01:00:00.000Z';
    const shared = buildEntry(sharedAt, 'VT-2 task', 'VT-3 task');
    const resourceOverride = buildEntry(sharedAt, 'VT-2 task', 'VT-4 task');

    const merged = mergeLoopJournalEntries([resourceOverride], [fileOnly, shared], 10);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.completed).toBe('VT-1 task');
    expect(merged[1]?.completed).toBe('VT-2 task');
    expect(merged[1]?.next).toBe('VT-4 task');
  });

  it('returns the most recent entries up to limit', () => {
    const entries = [
      buildEntry('2026-07-01T01:00:00.000Z', 'A'),
      buildEntry('2026-07-02T01:00:00.000Z', 'B'),
      buildEntry('2026-07-03T01:00:00.000Z', 'C'),
    ];

    expect(mergeLoopJournalEntries([], entries, 2).map((entry) => entry.completed)).toEqual(['B', 'C']);
  });
});

describe('fromLoopEntryResource', () => {
  it('maps active loop-entry resources to journal entries', () => {
    const entry = buildEntry('2026-07-06T01:00:00.000Z', 'VT-1 task', 'VT-2 task');
    expect(fromLoopEntryResource(buildResource(entry))).toEqual(entry);
  });

  it('returns null for invalid metadata', () => {
    expect(
      fromLoopEntryResource({
        ...buildResource(buildEntry('2026-07-06T01:00:00.000Z', 'VT-1 task')),
        metadata: { actorId: 'x' },
      }),
    ).toBeNull();
  });
});

describe('createCompositeLoopJournalReader', () => {
  it('reads from file when resource repository is absent', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-file-'));
    const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      '- 2026/7/6 10:00 · 完了: VT-1 task → 次: VT-2 task (window-user)\n',
      'utf8',
    );

    const reader = createCompositeLoopJournalReader({ repoRoot });
    const entries = await reader.readRecent(5);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.completed).toBe('VT-1 task');
  });

  it('falls back to file when resource repository throws', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-fallback-'));
    const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      '- 2026/7/6 10:00 · 完了: VT-1 task (window-user)\n',
      'utf8',
    );

    const resourceRepository: ResourceRepository = {
      findByRef: vi.fn(),
      list: vi.fn(async () => {
        throw new Error('db unavailable');
      }),
      save: vi.fn(),
      exists: vi.fn(),
    };

    const reader = createCompositeLoopJournalReader({ repoRoot, resourceRepository });
    const entries = await reader.readRecent(5);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.completed).toBe('VT-1 task');
  });

  it('merges resource and file entries when resources exist', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-merge-'));
    const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      '- 2026/7/5 10:00 · 完了: VT-0 task (window-user)\n',
      'utf8',
    );

    const resourceEntry = buildEntry('2026-07-06T01:00:00.000Z', 'VT-1 task', 'VT-2 task');
    const resourceRepository: ResourceRepository = {
      findByRef: vi.fn(),
      list: vi.fn(async () => ({
        items: [buildResource(resourceEntry)],
        total: 1,
        page: 1,
        limit: 20,
      })),
      save: vi.fn(),
      exists: vi.fn(),
    };

    const reader = createCompositeLoopJournalReader({ repoRoot, resourceRepository });
    const entries = await reader.readRecent(10);

    expect(entries.map((entry) => entry.completed)).toEqual(['VT-0 task', 'VT-1 task']);
  });
});

describe('readLoopJournalFromFile', () => {
  it('returns empty array when journal file is missing', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-missing-'));
    await expect(readLoopJournalFromFile(repoRoot, 5)).resolves.toEqual([]);
  });
});
