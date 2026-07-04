export const DOMAIN_EVENT_VERSION = 1 as const;

export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  eventVersion: typeof DOMAIN_EVENT_VERSION;
  occurredAt: string;
  actorId: string;
  mode: string;
  payload: TPayload;
}

export function createDomainEvent<TPayload extends Record<string, unknown>>(
  input: Omit<DomainEvent<TPayload>, 'eventVersion' | 'occurredAt'> & { occurredAt?: string },
): DomainEvent<TPayload> {
  return {
    ...input,
    eventVersion: DOMAIN_EVENT_VERSION,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}
