import {
  type ContextDashboard,
  type ContextKey,
  type ContextSnapshotItem,
  type ContextUpdateItem,
  type UrmsMode,
} from '@urms/shared';
import { AppError, ERROR_CODES } from '@urms/shared';

import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { EventBus } from '../event/event-bus.js';
import { assertModeAllowed, modePolicy } from '../mode/mode-policy.js';
import type { ContextRepository } from '../repository/context-repository.js';
import { buildAdvanceTaskUpdates } from './advance-context-task.js';
import { DEFAULT_CONTEXT_ITEMS } from './context-defaults.js';
import { validateContextUpdateItems } from './context-validator.js';

const DEFAULT_ITEMS = DEFAULT_CONTEXT_ITEMS;

export class ContextService {
  constructor(
    private readonly repository: ContextRepository,
    private readonly eventBus: EventBus,
  ) {}

  async getDashboard(mode: UrmsMode): Promise<ContextDashboard> {
    assertModeAllowed(modePolicy.canReadContext(mode), 'Context read not allowed in current mode');

    const stored = await this.repository.findAll();
    const byKey = new Map(stored.map((item) => [item.key, item]));
    const now = new Date().toISOString();

    const items = (Object.keys(DEFAULT_ITEMS) as ContextKey[]).map((key) => {
      const existing = byKey.get(key);
      if (existing) {
        return existing;
      }

      return {
        key,
        summary: DEFAULT_ITEMS[key].summary,
        ssotLinks: DEFAULT_ITEMS[key].ssotLinks,
        updatedAt: now,
        updatedBy: 'system',
      };
    });

    return {
      items,
      activeMode: mode,
    };
  }

  async update(
    items: ContextUpdateItem[],
    actorId: string,
    mode: UrmsMode,
  ): Promise<ContextDashboard> {
    assertModeAllowed(modePolicy.canUpdateContext(mode), 'Context update not allowed in current mode');
    validateContextUpdateItems(items);
    return this.persistUpdates(items, actorId, mode);
  }

  async advanceTask(actorId: string, mode: UrmsMode): Promise<ContextDashboard> {
    assertModeAllowed(
      modePolicy.canAdvanceContextTask(mode),
      'Context task advance not allowed in current mode',
    );

    const dashboard = await this.getDashboard(mode);
    const items = buildAdvanceTaskUpdates(dashboard);

    if (items.length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'No actionable current_task to advance');
    }

    validateContextUpdateItems(items);
    return this.persistUpdates(items, actorId, mode);
  }

  private async persistUpdates(
    items: ContextUpdateItem[],
    actorId: string,
    mode: UrmsMode,
  ): Promise<ContextDashboard> {
    const now = new Date().toISOString();

    for (const item of items) {
      const saved: ContextSnapshotItem = {
        key: item.key,
        summary: item.summary.trim(),
        ssotLinks: item.ssotLinks ?? [],
        updatedAt: now,
        updatedBy: actorId,
      };

      await this.repository.upsert(saved);
      await this.eventBus.publish(
        createDomainEvent({
          eventId: crypto.randomUUID(),
          eventType: EVENT_TYPES.ContextUpdated,
          actorId,
          mode,
          payload: { key: item.key, snapshot: saved },
        }),
      );
    }

    return this.getDashboard(mode);
  }
}
