import { describe, expect, it } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { InProcessEventBus } from '../event/event-bus.js';
import { PluginRegistry } from '../plugin/plugin-registry.js';
import type { ResourceTypePlugin } from '../plugin/resource-type-plugin.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import { ResourceService } from '../resource/resource-service.js';
import type { RelationRepository } from '../resource/relation-service.js';
import { RelationService } from '../resource/relation-service.js';
import {
  buildLoopEntryRelationRef,
  CONTEXT_CURRENT_TASK_RESOURCE_ID,
  CONTEXT_RESOURCE_TYPE,
  LOOP_CONTEXT_RELATION_TYPE,
  persistLoopEntryWithRelation,
  relateLoopEntryToCurrentTask,
} from './loop-entry-relation.js';
import { LOOP_ENTRY_RESOURCE_TYPE } from './loop-entry-resource.js';
import type { LoopJournalEntry } from './loop-journal-service.js';

function createLoopEntryTestPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'loop-entry',
    version: '1.0.0',
    coreVersion: '0.2.0',
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

function createContextTestPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'context',
    version: '1.0.0',
    coreVersion: '0.2.0',
    searchableFields: () => ['name'],
    validateCreate: () => [],
  };
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

class InMemoryRelationRepository implements RelationRepository {
  private readonly relations: Array<{
    id: string;
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    relationType: string;
    createdAt: string;
    createdBy?: string;
  }> = [];

  async findById(id: string) {
    return this.relations.find((relation) => relation.id === id) ?? null;
  }

  async list() {
    return [...this.relations];
  }

  async save(entity: {
    id: string;
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    relationType: string;
    createdAt: string;
    createdBy?: string;
  }) {
    this.relations.push(entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    const index = this.relations.findIndex((relation) => relation.id === id);
    if (index >= 0) {
      this.relations.splice(index, 1);
    }
  }

  async exists(
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationType: string,
  ): Promise<boolean> {
    return this.relations.some(
      (relation) =>
        relation.fromType === fromType &&
        relation.fromId === fromId &&
        relation.toType === toType &&
        relation.toId === toId &&
        relation.relationType === relationType,
    );
  }
}

function createServices(): {
  resourceService: ResourceService;
  relationService: RelationService;
  relationRepository: InMemoryRelationRepository;
  resourceRepository: InMemoryResourceRepository;
} {
  const registry = new PluginRegistry('0.2.0');
  registry.register(createLoopEntryTestPlugin());
  registry.register(createContextTestPlugin());
  const eventBus = new InProcessEventBus();
  const resourceRepository = new InMemoryResourceRepository();
  const relationRepository = new InMemoryRelationRepository();
  const resourceService = new ResourceService(resourceRepository, eventBus, registry);
  const relationService = new RelationService(relationRepository, resourceRepository, eventBus);
  return { resourceService, relationService, relationRepository, resourceRepository };
}

describe('loop-entry relation', () => {
  const entry: LoopJournalEntry = {
    completed: 'VT-4 task',
    next: 'Next task',
    actorId: 'window-user',
    at: new Date('2026-07-06T01:00:00.000Z'),
  };

  it('builds ADR-024 relation ref', () => {
    expect(buildLoopEntryRelationRef(entry)).toEqual({
      fromType: LOOP_ENTRY_RESOURCE_TYPE,
      fromId: 'loop:2026-07-06T01:00:00.000Z',
      toType: CONTEXT_RESOURCE_TYPE,
      toId: CONTEXT_CURRENT_TASK_RESOURCE_ID,
      relationType: LOOP_CONTEXT_RELATION_TYPE,
    });
  });

  it('creates loop-entry and relates_to context:current-task', async () => {
    const { resourceService, relationService, relationRepository } = createServices();

    const loopEntry = await persistLoopEntryWithRelation(
      resourceService,
      relationService,
      entry,
      'window-user',
      'operate',
    );

    expect(loopEntry?.resourceType).toBe(LOOP_ENTRY_RESOURCE_TYPE);
    expect(await relationRepository.list()).toHaveLength(1);
    expect((await relationRepository.list())[0]).toMatchObject({
      fromType: LOOP_ENTRY_RESOURCE_TYPE,
      toType: CONTEXT_RESOURCE_TYPE,
      toId: CONTEXT_CURRENT_TASK_RESOURCE_ID,
      relationType: LOOP_CONTEXT_RELATION_TYPE,
    });
  });

  it('ignores duplicate relates_to on re-advance with same timestamp', async () => {
    const { resourceService, relationService, relationRepository } = createServices();

    await persistLoopEntryWithRelation(resourceService, relationService, entry, 'window-user', 'operate');
    await persistLoopEntryWithRelation(resourceService, relationService, entry, 'window-user', 'operate');

    expect(await relationRepository.list()).toHaveLength(1);
  });

  it('relateLoopEntryToCurrentTask ensures context resource exists', async () => {
    const { resourceService, relationService, relationRepository, resourceRepository } = createServices();
    const loopEntry: ResourceEntity = {
      resourceType: LOOP_ENTRY_RESOURCE_TYPE,
      resourceId: 'loop:2026-07-06T01:00:00.000Z',
      name: 'VT-4 task',
      status: 'active',
      metadata: {},
      createdAt: '2026-07-06T01:00:00.000Z',
      updatedAt: '2026-07-06T01:00:00.000Z',
    };

    await resourceRepository.save(loopEntry);

    await relateLoopEntryToCurrentTask(
      relationService,
      resourceService,
      loopEntry,
      entry,
      'window-user',
      'operate',
    );

    const context = await resourceService.getByRef(
      CONTEXT_RESOURCE_TYPE,
      CONTEXT_CURRENT_TASK_RESOURCE_ID,
      'operate',
    );
    expect(context.status).toBe('active');
    expect(context.metadata.contextKey).toBe('current_task');
    expect(await relationRepository.list()).toHaveLength(1);
  });
});
