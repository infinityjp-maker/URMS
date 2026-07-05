import { describe, expect, it, vi } from 'vitest';

import { AuditHandler } from './audit-handler.js';
import type { AuditLogRepository } from './audit-log-repository.js';
import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';

describe('AuditHandler', () => {
  it('maps ResourceCreated to CREATE audit entry', async () => {
    const repository: AuditLogRepository = {
      append: vi.fn(),
      list: vi.fn(),
    };
    const handler = new AuditHandler(repository);

    await handler.handle(
      createDomainEvent({
        eventId: 'evt-1',
        eventType: EVENT_TYPES.ResourceCreated,
        actorId: 'user-1',
        mode: 'operate',
        payload: {
          resource: {
            resourceType: 'physical',
            resourceId: 'server-01',
            name: 'Server',
            status: 'draft',
            metadata: {},
            createdAt: '2026-07-05T00:00:00.000Z',
            updatedAt: '2026-07-05T00:00:00.000Z',
          },
        },
      }),
    );

    expect(repository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resourceType: 'physical',
        resourceId: 'server-01',
        actorId: 'user-1',
        mode: 'operate',
      }),
    );
  });
});
