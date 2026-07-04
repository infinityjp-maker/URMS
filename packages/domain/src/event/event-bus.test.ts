import { describe, expect, it, vi } from 'vitest';

import { createDomainEvent } from './domain-event.js';
import { InProcessEventBus } from './event-bus.js';
import { EVENT_TYPES } from './event-types.js';

describe('InProcessEventBus', () => {
  it('delivers events to subscribed handlers', async () => {
    const bus = new InProcessEventBus();
    const handler = vi.fn();

    bus.subscribe(EVENT_TYPES.ResourceCreated, handler);
    const event = createDomainEvent({
      eventId: 'evt-1',
      eventType: EVENT_TYPES.ResourceCreated,
      actorId: 'user-1',
      mode: 'operate',
      payload: { resourceType: 'physical' },
    });

    await bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('unsubscribes handler', async () => {
    const bus = new InProcessEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe(EVENT_TYPES.ResourceUpdated, handler);
    unsubscribe();

    await bus.publish(
      createDomainEvent({
        eventId: 'evt-2',
        eventType: EVENT_TYPES.ResourceUpdated,
        actorId: 'user-1',
        mode: 'operate',
        payload: {},
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });
});
