import {
  type ContextDashboard,
  type ContextKey,
  type ContextSnapshotItem,
  type ContextUpdateItem,
  type UrmsMode,
} from '@urms/shared';

import { createDomainEvent } from '../event/domain-event.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { EventBus } from '../event/event-bus.js';
import { assertModeAllowed, modePolicy } from '../mode/mode-policy.js';
import type { ContextRepository } from '../repository/context-repository.js';
import { validateContextUpdateItems } from './context-validator.js';

const DEFAULT_ITEMS: Record<ContextKey, Pick<ContextSnapshotItem, 'summary' | 'ssotLinks'>> = {
  current_phase: {
    summary: 'Phase 4 品質 · Phase 5 本番UI',
    ssotLinks: [
      {
        label: 'Phase 5 Desktop UI',
        path: '/docs/implementation/11-phase5-desktop-ui.md',
      },
    ],
  },
  current_task: {
    summary: 'S12 監視 · ログ — 完了 / S13 準備',
    ssotLinks: [
      {
        label: 'Phase 4 Readiness',
        path: '/docs/implementation/10-phase4-readiness.md',
      },
    ],
  },
  next_task: {
    summary: 'S13 性能 · セキュリティ監査',
    ssotLinks: [
      {
        label: 'Development Roadmap',
        path: '/docs/implementation/05-development-roadmap.md',
      },
    ],
  },
  project_status: {
    summary: 'Phase 4 進行中 — 本番UI（窓）v1 稼働',
    ssotLinks: [
      {
        label: 'VISION',
        path: '/docs/project/VISION.md',
      },
    ],
  },
  active_mode: {
    summary: 'plan',
    ssotLinks: [],
  },
  ssot_links: {
    summary: '要件 · Architecture · Contract',
    ssotLinks: [
      { label: 'UI Requirements', path: '/docs/requirements/ui-requirements.md' },
      { label: 'Implementation Contract', path: '/docs/implementation/01-implementation-contract.md' },
    ],
  },
};

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
