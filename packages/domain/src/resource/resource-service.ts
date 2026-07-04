import {
  AppError,
  ERROR_CODES,
  type ResourceEntity,
  type ResourceStatus,
  type UrmsMode,
} from '@urms/shared';

import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { EventBus } from '../event/event-bus.js';
import { assertModeAllowed, modePolicy } from '../mode/mode-policy.js';
import type { ResourceListFilter, ResourceRepository } from '../repository/resource-repository.js';
import { assertValidTransition } from './lifecycle.js';

export interface CreateResourceInput {
  resourceType: string;
  resourceId: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateResourceInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

export class ResourceService {
  constructor(
    private readonly repository: ResourceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async getByRef(resourceType: string, resourceId: string, mode: UrmsMode): Promise<ResourceEntity> {
    assertModeAllowed(modePolicy.canReadResource(mode), 'Resource read not allowed in current mode');

    const entity = await this.repository.findByRef(resourceType, resourceId);
    if (!entity) {
      throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, `Resource not found: ${resourceType}:${resourceId}`);
    }

    return entity;
  }

  async list(filter: ResourceListFilter, mode: UrmsMode) {
    assertModeAllowed(modePolicy.canReadResource(mode), 'Resource list not allowed in current mode');
    return this.repository.list(filter);
  }

  async create(
    input: CreateResourceInput,
    actorId: string,
    mode: UrmsMode,
  ): Promise<ResourceEntity> {
    assertModeAllowed(modePolicy.canWriteResource(mode), 'Resource creation not allowed in current mode');
    validateCreateInput(input);

    if (await this.repository.exists(input.resourceType, input.resourceId)) {
      throw new AppError(
        ERROR_CODES.RESOURCE_DUPLICATE_ID,
        `Resource already exists: ${input.resourceType}:${input.resourceId}`,
      );
    }

    const now = new Date().toISOString();
    const entity: ResourceEntity = {
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      name: input.name.trim(),
      status: 'draft',
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.repository.save(entity);
    await this.eventBus.publish(
      createDomainEvent({
        eventId: crypto.randomUUID(),
        eventType: EVENT_TYPES.ResourceCreated,
        actorId,
        mode,
        payload: { resource: saved },
      }),
    );

    return saved;
  }

  async update(
    resourceType: string,
    resourceId: string,
    input: UpdateResourceInput,
    actorId: string,
    mode: UrmsMode,
  ): Promise<ResourceEntity> {
    assertModeAllowed(modePolicy.canWriteResource(mode), 'Resource update not allowed in current mode');

    const current = await this.getByRef(resourceType, resourceId, mode);
    if (current.status === 'archived') {
      throw new AppError(ERROR_CODES.RESOURCE_INVALID_LIFECYCLE, 'Cannot update archived resource');
    }

    const updated: ResourceEntity = {
      ...current,
      name: input.name?.trim() ?? current.name,
      metadata: input.metadata ?? current.metadata,
      updatedAt: new Date().toISOString(),
    };

    if (!updated.name) {
      throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'name is required');
    }

    const saved = await this.repository.save(updated);
    await this.eventBus.publish(
      createDomainEvent({
        eventId: crypto.randomUUID(),
        eventType: EVENT_TYPES.ResourceUpdated,
        actorId,
        mode,
        payload: { resource: saved, previous: current },
      }),
    );

    return saved;
  }

  async changeLifecycle(
    resourceType: string,
    resourceId: string,
    status: ResourceStatus,
    actorId: string,
    mode: UrmsMode,
  ): Promise<ResourceEntity> {
    assertModeAllowed(
      modePolicy.canWriteResource(mode),
      'Resource lifecycle change not allowed in current mode',
    );

    const current = await this.getByRef(resourceType, resourceId, mode);
    assertValidTransition(current.status, status);

    const updated: ResourceEntity = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.repository.save(updated);
    const eventType =
      status === 'archived' ? EVENT_TYPES.ResourceArchived : EVENT_TYPES.ResourceLifecycleChanged;

    await this.eventBus.publish(
      createDomainEvent({
        eventId: crypto.randomUUID(),
        eventType,
        actorId,
        mode,
        payload: { resource: saved, previousStatus: current.status },
      }),
    );

    return saved;
  }
}

function validateCreateInput(input: CreateResourceInput): void {
  const details = [];

  if (!input.resourceType?.trim()) {
    details.push({ field: 'resourceType', message: 'resourceType is required' });
  }
  if (!input.resourceId?.trim()) {
    details.push({ field: 'resourceId', message: 'resourceId is required' });
  }
  if (!input.name?.trim()) {
    details.push({ field: 'name', message: 'name is required' });
  }

  if (details.length > 0) {
    throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'Validation failed', details);
  }
}
