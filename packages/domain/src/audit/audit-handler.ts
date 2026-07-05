import type { ResourceEntity } from '@urms/shared';

import type { DomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { AuditAction, AuditLogCreateInput, AuditLogRepository } from './audit-log-repository.js';

export class AuditHandler {
  constructor(private readonly repository: AuditLogRepository) {}

  async handle(event: DomainEvent): Promise<void> {
    const action = mapEventTypeToAction(event.eventType);
    if (!action) {
      return;
    }

    const contextKey = extractContextKey(event);
    const resource = extractResource(event.payload);
    const input: AuditLogCreateInput = {
      action,
      resourceType: contextKey ? 'context' : resource?.resourceType,
      resourceId: contextKey ?? resource?.resourceId,
      actorId: event.actorId,
      mode: event.mode,
      payload: event.payload,
    };

    await this.repository.append(input);
  }
}

function mapEventTypeToAction(eventType: string): AuditAction | undefined {
  switch (eventType) {
    case EVENT_TYPES.ResourceCreated:
      return 'CREATE';
    case EVENT_TYPES.ResourceUpdated:
      return 'UPDATE';
    case EVENT_TYPES.ResourceArchived:
      return 'DELETE';
    case EVENT_TYPES.ResourceLifecycleChanged:
      return 'LIFECYCLE';
    case EVENT_TYPES.ContextUpdated:
      return 'UPDATE';
    case EVENT_TYPES.RelationCreated:
      return 'CREATE';
    case EVENT_TYPES.RelationDeleted:
      return 'DELETE';
    default:
      return undefined;
  }
}

function extractContextKey(event: DomainEvent): string | undefined {
  if (event.eventType !== EVENT_TYPES.ContextUpdated) {
    return undefined;
  }

  const key = event.payload.key;
  return typeof key === 'string' ? key : undefined;
}

function extractResource(payload: Record<string, unknown>): ResourceEntity | undefined {
  const resource = payload.resource;
  if (!resource || typeof resource !== 'object') {
    return undefined;
  }

  const candidate = resource as Partial<ResourceEntity>;
  if (!candidate.resourceType || !candidate.resourceId) {
    return undefined;
  }

  return candidate as ResourceEntity;
}

export function registerAuditHandlers(
  eventBus: { subscribe(eventType: string, handler: (event: DomainEvent) => void | Promise<void>): () => void },
  handler: AuditHandler,
): void {
  const eventTypes = [
    EVENT_TYPES.ResourceCreated,
    EVENT_TYPES.ResourceUpdated,
    EVENT_TYPES.ResourceLifecycleChanged,
    EVENT_TYPES.ResourceArchived,
    EVENT_TYPES.ContextUpdated,
    EVENT_TYPES.RelationCreated,
    EVENT_TYPES.RelationDeleted,
  ];

  for (const eventType of eventTypes) {
    eventBus.subscribe(eventType, (event) => handler.handle(event));
  }
}
