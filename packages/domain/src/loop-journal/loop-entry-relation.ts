import { AppError, ERROR_CODES, type ResourceEntity, type UrmsMode } from '@urms/shared';

import type { RelationService } from '../resource/relation-service.js';
import type { ResourceService } from '../resource/resource-service.js';
import type { LoopJournalEntry } from './loop-journal-service.js';
import {
  buildLoopEntryResourceId,
  LOOP_ENTRY_RESOURCE_TYPE,
  persistLoopEntryResource,
} from './loop-entry-resource.js';

/** resource-catalog — context:current-task */
export const CONTEXT_RESOURCE_TYPE = 'context';
export const CONTEXT_CURRENT_TASK_RESOURCE_ID = 'current-task';
export const LOOP_CONTEXT_RELATION_TYPE = 'relates_to';

export async function ensureContextCurrentTaskResource(
  resourceService: ResourceService,
  entry: LoopJournalEntry,
  actorId: string,
  mode: UrmsMode,
): Promise<ResourceEntity> {
  const name =
    entry.completed.trim().length <= 40 ? entry.completed.trim() : `${entry.completed.trim().slice(0, 37)}...`;

  try {
    const existing = await resourceService.getByRef(
      CONTEXT_RESOURCE_TYPE,
      CONTEXT_CURRENT_TASK_RESOURCE_ID,
      mode,
    );

    if (existing.status === 'active') {
      return existing;
    }

    return resourceService.changeLifecycle(
      CONTEXT_RESOURCE_TYPE,
      CONTEXT_CURRENT_TASK_RESOURCE_ID,
      'active',
      actorId,
      mode,
    );
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== ERROR_CODES.RESOURCE_NOT_FOUND) {
      throw error;
    }
  }

  const created = await resourceService.create(
    {
      resourceType: CONTEXT_RESOURCE_TYPE,
      resourceId: CONTEXT_CURRENT_TASK_RESOURCE_ID,
      name,
      metadata: {
        contextKey: 'current_task',
        ssot: 'loop-advance',
        lastCompletedAt: entry.at.toISOString(),
      },
    },
    actorId,
    mode,
  );

  return resourceService.changeLifecycle(
    CONTEXT_RESOURCE_TYPE,
    CONTEXT_CURRENT_TASK_RESOURCE_ID,
    'active',
    actorId,
    mode,
  );
}

export async function relateLoopEntryToCurrentTask(
  relationService: RelationService,
  resourceService: ResourceService,
  loopEntry: ResourceEntity,
  entry: LoopJournalEntry,
  actorId: string,
  mode: UrmsMode,
): Promise<void> {
  await ensureContextCurrentTaskResource(resourceService, entry, actorId, mode);

  try {
    await relationService.create(
      {
        fromType: LOOP_ENTRY_RESOURCE_TYPE,
        fromId: loopEntry.resourceId,
        toType: CONTEXT_RESOURCE_TYPE,
        toId: CONTEXT_CURRENT_TASK_RESOURCE_ID,
        relationType: LOOP_CONTEXT_RELATION_TYPE,
      },
      actorId,
      mode,
    );
  } catch (error) {
    if (error instanceof AppError && error.code === ERROR_CODES.RELATION_DUPLICATE) {
      return;
    }

    throw error;
  }
}

/** ADR-024 — loop-entry Resource 作成 + context:current-task への relates_to */
export async function persistLoopEntryWithRelation(
  resourceService: ResourceService,
  relationService: RelationService | undefined,
  entry: LoopJournalEntry,
  actorId: string,
  mode: UrmsMode,
): Promise<ResourceEntity | null> {
  const loopEntry = await persistLoopEntryResource(resourceService, entry, actorId, mode);
  if (!loopEntry || !relationService) {
    return loopEntry;
  }

  await relateLoopEntryToCurrentTask(relationService, resourceService, loopEntry, entry, actorId, mode);
  return loopEntry;
}

export function buildLoopEntryRelationRef(entry: LoopJournalEntry): {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relationType: string;
} {
  return {
    fromType: LOOP_ENTRY_RESOURCE_TYPE,
    fromId: buildLoopEntryResourceId(entry.at),
    toType: CONTEXT_RESOURCE_TYPE,
    toId: CONTEXT_CURRENT_TASK_RESOURCE_ID,
    relationType: LOOP_CONTEXT_RELATION_TYPE,
  };
}
