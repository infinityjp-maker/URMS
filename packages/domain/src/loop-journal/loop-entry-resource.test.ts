import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES, type ResourceEntity } from '@urms/shared';

import { InProcessEventBus } from '../event/event-bus.js';
import { PluginRegistry } from '../plugin/plugin-registry.js';
import type { ResourceTypePlugin } from '../plugin/resource-type-plugin.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import { ResourceService } from '../resource/resource-service.js';
import {
  buildLoopEntryResourceId,
  persistLoopEntryResource,
  toLoopEntryResourceInput,
} from './loop-entry-resource.js';
import type { LoopJournalEntry } from './loop-journal-service.js';

function createLoopEntryTestPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'loop-entry',
    version: '1.0.0',
    coreVersion: '1.2.0',
    searchableFields: () => ['name'],
    validateCreate(input) {
      const details = [];
      for (const field of ['completed', 'actorId', 'occurredAt'] as const) {
        const value = input.metadata?.[field];
        if (typeof value !== 'string' || !value.trim()) {
          details.push({ field: `metadata.${field}`, message: `${field} required` });
        }
      }
      return details;
    },
  };
}

function createResourceService(): ResourceService {
  const registry = new PluginRegistry('1.2.0');
  registry.register(createLoopEntryTestPlugin());
  return new ResourceService(new InMemoryResourceRepository(), new InProcessEventBus(), registry);
}

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
}

describe('loop-entry resource', () => {
  const entry: LoopJournalEntry = {
    completed: 'VT-1 task',
    next: 'VT-2 task',
    actorId: 'window-user',
    at: new Date('2026-07-06T01:00:00.000Z'),
  };

  it('maps journal entry to loop-entry resource input', () => {
    expect(toLoopEntryResourceInput(entry)).toEqual({
      resourceType: 'loop-entry',
      resourceId: 'loop:2026-07-06T01:00:00.000Z',
      name: 'VT-1 task',
      metadata: {
        completed: 'VT-1 task',
        next: 'VT-2 task',
        actorId: 'window-user',
        occurredAt: '2026-07-06T01:00:00.000Z',
        sourcePath: '.cursor/resources/loop/journal.md',
        ssot: 'loop-resource-ssot',
      },
    });
  });

  it('builds ADR-024 resource id from occurredAt', () => {
    expect(buildLoopEntryResourceId(new Date('2026-07-07T13:00:00+09:00'))).toBe(
      'loop:2026-07-07T04:00:00.000Z',
    );
  });

  it('creates active loop-entry resource on persist', async () => {
    const service = createResourceService();
    const created = await persistLoopEntryResource(service, entry, 'window-user', 'operate');

    expect(created).toMatchObject({
      resourceType: 'loop-entry',
      resourceId: 'loop:2026-07-06T01:00:00.000Z',
      status: 'active',
      metadata: expect.objectContaining({ completed: 'VT-1 task' }),
    });
  });

  it('ignores duplicate loop-entry resource ids', async () => {
    const service = createResourceService();
    await persistLoopEntryResource(service, entry, 'window-user', 'operate');
    const duplicate = await persistLoopEntryResource(service, entry, 'window-user', 'operate');

    expect(duplicate).toBeNull();
  });

  it('rethrows non-duplicate errors', async () => {
    const service = createResourceService();
    vi.spyOn(service, 'create').mockRejectedValueOnce(
      new AppError(ERROR_CODES.VALIDATION_FAILED, 'invalid loop-entry'),
    );

    await expect(persistLoopEntryResource(service, entry, 'window-user', 'operate')).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
  });
});
