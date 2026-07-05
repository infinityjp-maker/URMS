import { describe, expect, it, vi } from 'vitest';

import { InProcessEventBus } from '../event/event-bus.js';
import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import { AuditHandler, registerAuditHandlers } from './audit-handler.js';
import type { AuditLogRepository } from './audit-log-repository.js';

const sampleResource = {
  resourceType: 'physical',
  resourceId: 'server-01',
  name: 'Server',
  status: 'draft' as const,
  metadata: {},
  createdAt: '2026-07-05T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
};

function createRepository(): AuditLogRepository {
  return {
    append: vi.fn(),
    list: vi.fn(),
  };
}

describe('AuditHandler', () => {
  it('maps ResourceCreated to CREATE audit entry', async () => {
    const repository = createRepository();
    const handler = new AuditHandler(repository);

    await handler.handle(
      createDomainEvent({
        eventId: 'evt-1',
        eventType: EVENT_TYPES.ResourceCreated,
        actorId: 'user-1',
        mode: 'operate',
        payload: { resource: sampleResource },
      }),
    );

    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resourceType: 'physical',
        resourceId: 'server-01',
      }),
    );
  });

  it('maps lifecycle and context events', async () => {
    const repository = createRepository();
    const handler = new AuditHandler(repository);

    await handler.handle(
      createDomainEvent({
        eventId: 'evt-2',
        eventType: EVENT_TYPES.ResourceLifecycleChanged,
        actorId: 'user-1',
        mode: 'operate',
        payload: { resource: sampleResource },
      }),
    );

    await handler.handle(
      createDomainEvent({
        eventId: 'evt-3',
        eventType: EVENT_TYPES.ContextUpdated,
        actorId: 'user-1',
        mode: 'plan',
        payload: { key: 'current_task', summary: 'task' },
      }),
    );

    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LIFECYCLE' }),
    );
    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        resourceType: 'context',
        resourceId: 'current_task',
      }),
    );
  });

  it('ignores unmapped event types', async () => {
    const repository = createRepository();
    const handler = new AuditHandler(repository);

    await handler.handle(
      createDomainEvent({
        eventId: 'evt-4',
        eventType: 'UnknownEvent',
        actorId: 'user-1',
        mode: 'operate',
        payload: {},
      }),
    );

    expect(repository.append).not.toHaveBeenCalled();
  });
});

describe('registerAuditHandlers', () => {
  it('subscribes audit handler to domain events', async () => {
    const repository = createRepository();
    const handler = new AuditHandler(repository);
    const eventBus = new InProcessEventBus();

    registerAuditHandlers(eventBus, handler);

    await eventBus.publish(
      createDomainEvent({
        eventId: 'evt-5',
        eventType: EVENT_TYPES.ResourceUpdated,
        actorId: 'user-1',
        mode: 'operate',
        payload: { resource: sampleResource },
      }),
    );

    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE' }),
    );
  });
});
