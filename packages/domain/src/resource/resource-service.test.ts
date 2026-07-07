import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES, type ResourceEntity } from '@urms/shared';

import { InProcessEventBus } from '../event/event-bus.js';
import { EVENT_TYPES } from '../event/event-types.js';
import { PluginRegistry } from '../plugin/plugin-registry.js';
import type { ResourceTypePlugin } from '../plugin/resource-type-plugin.js';
import type { ResourceListFilter, ResourceRepository } from '../repository/resource-repository.js';
import { ResourceService } from './resource-service.js';

class InMemoryResourceRepository implements ResourceRepository {
  private readonly store = new Map<string, ResourceEntity>();

  private key(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  async findByRef(resourceType: string, resourceId: string): Promise<ResourceEntity | null> {
    return this.store.get(this.key(resourceType, resourceId)) ?? null;
  }

  async list(filter: ResourceListFilter) {
    const items = [...this.store.values()].filter((item) => {
      if (filter.resourceType && item.resourceType !== filter.resourceType) return false;
      if (filter.status && item.status !== filter.status) return false;
      if (filter.q && !item.name.includes(filter.q)) return false;
      return true;
    });

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      items: items.slice(start, start + limit),
      total: items.length,
      page,
      limit,
    };
  }

  async save(entity: ResourceEntity): Promise<ResourceEntity> {
    this.store.set(this.key(entity.resourceType, entity.resourceId), entity);
    return entity;
  }

  async exists(resourceType: string, resourceId: string): Promise<boolean> {
    return this.store.has(this.key(resourceType, resourceId));
  }
}

describe('ResourceService', () => {
  function createService(pluginRegistry?: PluginRegistry) {
    const repository = new InMemoryResourceRepository();
    const eventBus = new InProcessEventBus();
    const service = new ResourceService(repository, eventBus, pluginRegistry);
    return { service, eventBus, repository };
  }

  it('gets resource by ref and lists with filter', async () => {
    const { service } = createService();
    await service.create(
      { resourceType: 'physical', resourceId: 'get-1', name: 'Get One' },
      'user-1',
      'operate',
    );

    const entity = await service.getByRef('physical', 'get-1', 'operate');
    expect(entity.name).toBe('Get One');

    const list = await service.list({ q: 'Get' }, 'operate');
    expect(list.total).toBe(1);
  });

  it('throws when resource is not found', async () => {
    const { service } = createService();

    await expect(service.getByRef('physical', 'missing', 'operate')).rejects.toMatchObject({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
    });
  });

  it('updates resource and rejects archived updates', async () => {
    const { service } = createService();
    await service.create(
      { resourceType: 'physical', resourceId: 'upd-1', name: 'Before' },
      'user-1',
      'operate',
    );
    await service.changeLifecycle('physical', 'upd-1', 'active', 'user-1', 'operate');
    await service.changeLifecycle('physical', 'upd-1', 'archived', 'user-1', 'operate');

    await expect(
      service.update('physical', 'upd-1', { name: 'After' }, 'user-1', 'operate'),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESOURCE_INVALID_LIFECYCLE });

    await service.create(
      { resourceType: 'physical', resourceId: 'upd-2', name: 'Before 2' },
      'user-1',
      'operate',
    );
    const updated = await service.update(
      'physical',
      'upd-2',
      { name: 'After 2' },
      'user-1',
      'operate',
    );
    expect(updated.name).toBe('After 2');
  });

  it('validates required create fields', async () => {
    const { service } = createService();

    await expect(
      service.create({ resourceType: '', resourceId: '', name: '' }, 'user-1', 'operate'),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_REQUIRED_FIELD });
  });

  it('validates create and update through plugin registry', async () => {
    const plugin: ResourceTypePlugin = {
      resourceType: 'physical',
      version: '1.0.0',
      coreVersion: '1.2.0',
      validateCreate: (input) =>
        input.metadata?.location
          ? []
          : [{ field: 'metadata.location', message: 'required' }],
      validateUpdate: (input) =>
        input.name === 'Bad' ? [{ field: 'name', message: 'invalid' }] : [],
      searchableFields: () => ['name'],
    };
    const registry = new PluginRegistry('1.2.0');
    registry.register(plugin);
    const { service } = createService(registry);

    await expect(
      service.create(
        { resourceType: 'physical', resourceId: 'plug-1', name: 'Plug' },
        'user-1',
        'operate',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.PLUGIN_VALIDATION_FAILED });

    await service.create(
      {
        resourceType: 'physical',
        resourceId: 'plug-2',
        name: 'Plug 2',
        metadata: { location: 'rack-a' },
      },
      'user-1',
      'operate',
    );

    await expect(
      service.update('physical', 'plug-2', { name: 'Bad' }, 'user-1', 'operate'),
    ).rejects.toMatchObject({ code: ERROR_CODES.PLUGIN_VALIDATION_FAILED });
  });

  it('creates resource in operate mode and publishes ResourceCreated', async () => {
    const { service, eventBus } = createService();
    const handler = vi.fn();
    eventBus.subscribe(EVENT_TYPES.ResourceCreated, handler);

    const created = await service.create(
      {
        resourceType: 'physical',
        resourceId: 'server-01',
        name: 'Server 01',
      },
      'user-1',
      'operate',
    );

    expect(created.status).toBe('draft');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('rejects create in plan mode', async () => {
    const { service } = createService();

    await expect(
      service.create(
        { resourceType: 'physical', resourceId: 'x', name: 'X' },
        'user-1',
        'plan',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.MODE_NOT_ALLOWED });
  });

  it('rejects duplicate resource id', async () => {
    const { service } = createService();
    const input = { resourceType: 'physical', resourceId: 'dup', name: 'Dup' };

    await service.create(input, 'user-1', 'operate');
    await expect(service.create(input, 'user-1', 'operate')).rejects.toMatchObject({
      code: ERROR_CODES.RESOURCE_DUPLICATE_ID,
    });
  });

  it('changes lifecycle with valid transition', async () => {
    const { service } = createService();
    await service.create(
      { resourceType: 'physical', resourceId: 'lc-1', name: 'LC' },
      'user-1',
      'operate',
    );

    const active = await service.changeLifecycle('physical', 'lc-1', 'active', 'user-1', 'operate');
    expect(active.status).toBe('active');
  });

  it('rejects invalid lifecycle transition', async () => {
    const { service } = createService();
    await service.create(
      { resourceType: 'physical', resourceId: 'lc-2', name: 'LC2' },
      'user-1',
      'operate',
    );

    await expect(
      service.changeLifecycle('physical', 'lc-2', 'deprecated', 'user-1', 'operate'),
    ).rejects.toBeInstanceOf(AppError);
  });
});
