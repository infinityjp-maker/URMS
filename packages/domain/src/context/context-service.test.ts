import { describe, expect, it, vi } from 'vitest';

import { CONTEXT_SUMMARY_MAX_LENGTH } from '@urms/shared';
import type { ContextSnapshotItem, ContextUpdateItem } from '@urms/shared';

import { InProcessEventBus } from '../event/event-bus.js';
import { EVENT_TYPES } from '../event/event-types.js';
import type { ContextRepository } from '../repository/context-repository.js';
import { ContextService } from './context-service.js';
import { validateContextUpdateItems, validateSummary, validateSsotLinks } from './context-validator.js';

describe('validateSummary', () => {
  it('rejects empty summary', () => {
    expect(() => validateSummary('   ')).toThrow(/summary is required/);
  });

  it('rejects summary over 500 characters', () => {
    expect(() => validateSummary('a'.repeat(CONTEXT_SUMMARY_MAX_LENGTH + 1))).toThrow(/500/);
  });

  it('rejects markdown headings', () => {
    expect(() => validateSummary('## Heading\nBody')).toThrow(/Markdown/);
  });

  it('accepts valid summary', () => {
    expect(() => validateSummary('Phase 3 — Sprint S6')).not.toThrow();
  });
});

describe('validateSsotLinks', () => {
  it('rejects invalid path prefix', () => {
    expect(() =>
      validateSsotLinks([{ label: 'Bad', path: '/etc/passwd' }]),
    ).toThrow(/prefix/);
  });

  it('accepts /docs/ paths', () => {
    expect(() =>
      validateSsotLinks([{ label: 'VISION', path: '/docs/project/VISION.md' }]),
    ).not.toThrow();
  });
});

describe('validateContextUpdateItems', () => {
  it('rejects active_mode updates', () => {
    expect(() =>
      validateContextUpdateItems([
        {
          key: 'active_mode' as never,
          summary: 'operate',
        },
      ]),
    ).toThrow(/not editable/);
  });
});

function createMemoryRepository(): ContextRepository & { items: Map<string, ContextSnapshotItem> } {
  const items = new Map<string, ContextSnapshotItem>();

  return {
    items,
    async findByKey(key) {
      return items.get(key) ?? null;
    },
    async findAll() {
      return [...items.values()];
    },
    async upsert(item) {
      items.set(item.key, item);
      return item;
    },
  };
}

describe('ContextService', () => {
  it('returns default dashboard in plan mode', async () => {
    const repository = createMemoryRepository();
    const eventBus = new InProcessEventBus();
    const service = new ContextService(repository, eventBus);

    const dashboard = await service.getDashboard('plan');

    expect(dashboard.activeMode).toBe('plan');
    expect(dashboard.items).toHaveLength(6);
    expect(dashboard.items.find((item) => item.key === 'current_phase')?.summary).toContain('Vision Track');
  });

  it('denies update outside plan mode', async () => {
    const repository = createMemoryRepository();
    const service = new ContextService(repository, new InProcessEventBus());

    await expect(
      service.update([{ key: 'current_task', summary: 'Updated task' }], 'pm-user', 'operate'),
    ).rejects.toMatchObject({ code: 'MODE_NOT_ALLOWED' });
  });

  it('persists updates and publishes ContextUpdated', async () => {
    const repository = createMemoryRepository();
    const eventBus = new InProcessEventBus();
    const handler = vi.fn();
    eventBus.subscribe(EVENT_TYPES.ContextUpdated, handler);

    const service = new ContextService(repository, eventBus);
    const update: ContextUpdateItem = {
      key: 'current_task',
      summary: 'S6 完了確認',
      ssotLinks: [{ label: 'UI Requirements', path: '/docs/requirements/ui-requirements.md' }],
    };

    const dashboard = await service.update([update], 'pm-user', 'plan');

    expect(dashboard.items.find((item) => item.key === 'current_task')?.summary).toBe('S6 完了確認');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(repository.items.get('current_task')?.updatedBy).toBe('pm-user');
  });
});
