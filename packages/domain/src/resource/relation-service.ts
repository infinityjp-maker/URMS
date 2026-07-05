import { AppError, ERROR_CODES, type ResourceRelationEntity, type UrmsMode } from '@urms/shared';

import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { EventBus } from '../event/event-bus.js';
import { assertModeAllowed, modePolicy } from '../mode/mode-policy.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import { assertValidRelationType, validateRelationEndpoints } from './relation-validator.js';

export interface RelationListFilter {
  fromType?: string;
  fromId?: string;
  toType?: string;
  toId?: string;
  relationType?: string;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
}

export interface RelationRepository {
  findById(id: string): Promise<ResourceRelationEntity | null>;
  list(filter: RelationListFilter): Promise<ResourceRelationEntity[]>;
  save(entity: ResourceRelationEntity): Promise<ResourceRelationEntity>;
  delete(id: string): Promise<void>;
  exists(
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationType: string,
  ): Promise<boolean>;
}

export interface CreateRelationInput {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relationType: string;
}

export class RelationService {
  constructor(
    private readonly relationRepository: RelationRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async list(filter: RelationListFilter, mode: UrmsMode): Promise<ResourceRelationEntity[]> {
    assertModeAllowed(modePolicy.canReadResource(mode), 'Relation list not allowed in current mode');
    return this.relationRepository.list(filter);
  }

  async listForResource(
    resourceType: string,
    resourceId: string,
    mode: UrmsMode,
  ): Promise<ResourceRelationEntity[]> {
    await this.assertResourceReadable(resourceType, resourceId, mode);
    return this.relationRepository.list({ resourceType, resourceId, limit: 50 });
  }

  async create(input: CreateRelationInput, actorId: string, mode: UrmsMode): Promise<ResourceRelationEntity> {
    assertModeAllowed(modePolicy.canWriteResource(mode), 'Relation create not allowed in current mode');
    validateRelationEndpoints(input);

    await this.assertResourceWritable(input.fromType, input.fromId, mode);
    await this.assertResourceWritable(input.toType, input.toId, mode);

    if (
      await this.relationRepository.exists(
        input.fromType,
        input.fromId,
        input.toType,
        input.toId,
        input.relationType,
      )
    ) {
      throw new AppError(
        ERROR_CODES.RELATION_DUPLICATE,
        `Relation already exists: ${input.fromType}:${input.fromId} → ${input.toType}:${input.toId} (${input.relationType})`,
      );
    }

    const entity: ResourceRelationEntity = {
      id: crypto.randomUUID(),
      fromType: input.fromType.trim(),
      fromId: input.fromId.trim(),
      toType: input.toType.trim(),
      toId: input.toId.trim(),
      relationType: assertValidRelationType(input.relationType),
      createdAt: new Date().toISOString(),
      createdBy: actorId,
    };

    const saved = await this.relationRepository.save(entity);
    await this.eventBus.publish(
      createDomainEvent({
        eventId: crypto.randomUUID(),
        eventType: EVENT_TYPES.RelationCreated,
        actorId,
        mode,
        payload: { relation: saved },
      }),
    );

    return saved;
  }

  async delete(relationId: string, actorId: string, mode: UrmsMode): Promise<void> {
    assertModeAllowed(modePolicy.canWriteResource(mode), 'Relation delete not allowed in current mode');

    const current = await this.relationRepository.findById(relationId);
    if (!current) {
      throw new AppError(ERROR_CODES.RELATION_NOT_FOUND, `Relation not found: ${relationId}`);
    }

    await this.relationRepository.delete(relationId);
    await this.eventBus.publish(
      createDomainEvent({
        eventId: crypto.randomUUID(),
        eventType: EVENT_TYPES.RelationDeleted,
        actorId,
        mode,
        payload: { relation: current },
      }),
    );
  }

  private async assertResourceReadable(resourceType: string, resourceId: string, mode: UrmsMode): Promise<void> {
    assertModeAllowed(modePolicy.canReadResource(mode), 'Resource read not allowed in current mode');
    const entity = await this.resourceRepository.findByRef(resourceType, resourceId);
    if (!entity) {
      throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, `Resource not found: ${resourceType}:${resourceId}`);
    }
  }

  private async assertResourceWritable(resourceType: string, resourceId: string, mode: UrmsMode): Promise<void> {
    await this.assertResourceReadable(resourceType, resourceId, mode);
    const entity = await this.resourceRepository.findByRef(resourceType, resourceId);
    if (!entity || entity.status === 'archived') {
      throw new AppError(
        ERROR_CODES.RELATION_INVALID,
        `Cannot relate archived or missing resource: ${resourceType}:${resourceId}`,
      );
    }
  }
}
