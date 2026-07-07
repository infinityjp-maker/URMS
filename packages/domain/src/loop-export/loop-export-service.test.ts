import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { LOOP_JOURNAL_PATH } from '../loop-journal/loop-journal-service.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import { LoopExportService } from './loop-export-service.js';

class InMemoryResourceRepository implements ResourceRepository {
  private readonly store = new Map<string, ResourceEntity>();

  private key(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  async findByRef(resourceType: string, resourceId: string): Promise<ResourceEntity | null> {
    return this.store.get(this.key(resourceType, resourceId)) ?? null;
  }

  async list(filter?: { resourceType?: string; status?: string; limit?: number; page?: number }) {
    let items = [...this.store.values()];

    if (filter?.resourceType) {
      items = items.filter((item) => item.resourceType === filter.resourceType);
    }
    if (filter?.status) {
      items = items.filter((item) => item.status === filter.status);
    }

    const limit = filter?.limit ?? items.length;
    const page = filter?.page ?? 1;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);

    return { items: pageItems, total: items.length, page, limit };
  }

  async save(entity: ResourceEntity): Promise<ResourceEntity> {
    this.store.set(this.key(entity.resourceType, entity.resourceId), entity);
    return entity;
  }

  async exists(resourceType: string, resourceId: string): Promise<boolean> {
    return this.store.has(this.key(resourceType, resourceId));
  }

  seed(entity: ResourceEntity): void {
    this.store.set(this.key(entity.resourceType, entity.resourceId), entity);
  }
}

describe('LoopExportService', () => {
  it('writes journal.md from loop-entry resources', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-export-'));
    const repository = new InMemoryResourceRepository();

    repository.seed({
      resourceType: 'loop-entry',
      resourceId: 'loop:2026-07-06T01:00:00.000Z',
      name: 'VT-1 task',
      status: 'active',
      metadata: {
        completed: 'VT-1 task',
        next: 'VT-2 task',
        actorId: 'window-user',
        occurredAt: '2026-07-06T01:00:00.000Z',
        ssot: 'loop-resource-ssot',
      },
      createdAt: '2026-07-06T01:00:00.000Z',
      updatedAt: '2026-07-06T01:00:00.000Z',
    });

    const service = new LoopExportService({ repoRoot, resourceRepository: repository });
    const report = await service.export('loop-export', 'operate');

    expect(report.entryCount).toBe(1);
    expect(report.sourcePath).toBe(LOOP_JOURNAL_PATH);

    const raw = await readFile(path.join(repoRoot, LOOP_JOURNAL_PATH), 'utf8');
    expect(raw).toContain('正本は loop-entry Resource（DB）');
    expect(raw).toContain('VT-1 task');
    expect(raw).toContain('VT-2 task');
    expect(raw).toContain('window-user');
  });

  it('writes header-only journal when no resources exist', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-loop-export-empty-'));
    const repository = new InMemoryResourceRepository();
    const service = new LoopExportService({ repoRoot, resourceRepository: repository });

    const report = await service.export('loop-export', 'operate');
    expect(report.entryCount).toBe(0);

    const raw = await readFile(path.join(repoRoot, LOOP_JOURNAL_PATH), 'utf8');
    expect(raw).toContain('# 日次ループジャーナル');
    expect(raw).not.toContain(' · 完了:');
  });
});
