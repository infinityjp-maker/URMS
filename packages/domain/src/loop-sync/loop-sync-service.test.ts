import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { LOOP_JOURNAL_PATH } from '../loop-journal/loop-journal-service.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import { LoopSyncService } from './loop-sync-service.js';

class InMemoryResourceRepository implements ResourceRepository {
  private readonly store = new Map<string, ResourceEntity>();

  private key(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  async findByRef(resourceType: string, resourceId: string): Promise<ResourceEntity | null> {
    return this.store.get(this.key(resourceType, resourceId)) ?? null;
  }

  async list() {
    return { items: [...this.store.values()], total: this.store.size, page: 1, limit: 20 };
  }

  async save(entity: ResourceEntity): Promise<ResourceEntity> {
    this.store.set(this.key(entity.resourceType, entity.resourceId), entity);
    return entity;
  }

  async exists(resourceType: string, resourceId: string): Promise<boolean> {
    return this.store.has(this.key(resourceType, resourceId));
  }

  snapshot(): ResourceEntity[] {
    return [...this.store.values()];
  }
}

describe('LoopSyncService', () => {
  it('imports journal.md lines as active loop-entry resources', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-sync-'));
    const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      [
        '- 2026/7/5 10:00 · 完了: VT-1 task → 次: VT-2 task (window-user)',
        '- 2026/7/6 10:00 · 完了: VT-2 task (window-user)',
      ].join('\n'),
      'utf8',
    );

    const repository = new InMemoryResourceRepository();
    const service = new LoopSyncService({ repoRoot, resourceRepository: repository });
    const report = await service.sync('loop-sync', 'operate');

    expect(report.created).toBe(2);
    expect(report.updated).toBe(0);
    expect(report.skipped).toBe(0);

    const resources = repository.snapshot();
    expect(resources).toHaveLength(2);
    expect(resources.every((resource) => resource.resourceType === 'loop-entry')).toBe(true);
    expect(resources.every((resource) => resource.metadata.ssot === 'loop-sync')).toBe(true);
    expect(resources.map((resource) => resource.metadata.completed)).toEqual(['VT-1 task', 'VT-2 task']);
  });

  it('updates existing loop-entry resources on re-sync', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-resync-'));
    const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);
    await mkdir(path.dirname(journalPath), { recursive: true });
    await writeFile(
      journalPath,
      '- 2026/7/6 10:00 · 完了: VT-2 task → 次: VT-3 task (window-user)\n',
      'utf8',
    );

    const repository = new InMemoryResourceRepository();
    const service = new LoopSyncService({ repoRoot, resourceRepository: repository });

    const first = await service.sync('loop-sync', 'operate');
    expect(first.created).toBe(1);

    const second = await service.sync('loop-sync', 'operate');
    expect(second.updated).toBe(1);
    expect(second.created).toBe(0);
    expect(repository.snapshot()).toHaveLength(1);
  });

  it('returns empty report when journal file is missing', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-empty-'));
    const repository = new InMemoryResourceRepository();
    const service = new LoopSyncService({ repoRoot, resourceRepository: repository });

    const report = await service.sync('loop-sync', 'operate');
    expect(report).toEqual({ created: 0, updated: 0, skipped: 0, items: [] });
  });
});
