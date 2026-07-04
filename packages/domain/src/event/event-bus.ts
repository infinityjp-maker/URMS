import type { DomainEvent } from './domain-event.js';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): () => void;
}

export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  subscribe(eventType: string, handler: EventHandler): () => void {
    const set = this.handlers.get(eventType) ?? new Set<EventHandler>();
    set.add(handler);
    this.handlers.set(eventType, set);

    return () => {
      set.delete(handler);
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      await handler(event);
    }
  }
}
