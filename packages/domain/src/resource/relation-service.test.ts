import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@urms/shared';

import { InProcessEventBus } from '../event/event-bus.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { RelationRepository } from './relation-service.js';
import { RelationService } from './relation-service.js';
import type { ResourceRepository } from '../repository/resource-repository.js';

const physical = {
  resourceType: 'physical',
  resourceId: 'rack-a01',
  name: 'Rack A01',
  status: 'active' as const,
  metadata: { location: 'dc-1' },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const digital = {
  resourceType: 'digital',
  resourceId: 'license-01',
  name: 'License 01',
  status: 'active' as const,
  metadata: { vendor: 'Example' },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function createService(overrides: {
  relationRepository?: Partial<RelationRepository>;
  resourceRepository?: Partial<ResourceRepository>;
} = {}) {
  const eventBus = new InProcessEventBus();
  const relationRepository: RelationRepository = {
    findById: vi.fn(async () => null),
    list: vi.fn(async () => []),
    save: vi.fn(async (entity) => entity),
    delete: vi.fn(async () => undefined),
    exists: vi.fn(async () => false),
    ...overrides.relationRepository,
  };
  const resourceRepository: ResourceRepository = {
    findByRef: vi.fn(async (type, id) => {
      if (type === 'physical' && id === 'rack-a01') return physical;
      if (type === 'digital' && id === 'license-01') return digital;
      return null;
    }),
    list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 20 })),
    save: vi.fn(async (entity) => entity),
    exists: vi.fn(async () => false),
    ...overrides.resourceRepository,
  };

  return { service: new RelationService(relationRepository, resourceRepository, eventBus), eventBus, relationRepository };
}

describe('RelationService', () => {
  it('creates a relation between active resources', async () => {
    const { service, eventBus } = createService();
    const events: string[] = [];
    eventBus.subscribe(EVENT_TYPES.RelationCreated, (event) => {
      events.push(event.eventType);
    });

    const relation = await service.create(
      {
        fromType: 'digital',
        fromId: 'license-01',
        toType: 'physical',
        toId: 'rack-a01',
        relationType: 'depends_on',
      },
      'operator',
      'operate',
    );

    expect(relation.relationType).toBe('depends_on');
    expect(events).toEqual([EVENT_TYPES.RelationCreated]);
  });

  it('rejects duplicate relations', async () => {
    const { service } = createService({
      relationRepository: { exists: vi.fn(async () => true) },
    });

    await expect(
      service.create(
        {
          fromType: 'digital',
          fromId: 'license-01',
          toType: 'physical',
          toId: 'rack-a01',
          relationType: 'depends_on',
        },
        'operator',
        'operate',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.RELATION_DUPLICATE });
  });

  it('rejects self relations', async () => {
    const { service } = createService();

    await expect(
      service.create(
        {
          fromType: 'physical',
          fromId: 'rack-a01',
          toType: 'physical',
          toId: 'rack-a01',
          relationType: 'depends_on',
        },
        'operator',
        'operate',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.RELATION_INVALID });
  });
});
