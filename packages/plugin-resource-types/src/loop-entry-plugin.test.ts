import { describe, expect, it } from 'vitest';

import { createLoopEntryPlugin } from './loop-entry-plugin.js';

describe('createLoopEntryPlugin', () => {
  it('requires completed, actorId, and occurredAt on create', () => {
    const plugin = createLoopEntryPlugin();

    expect(plugin.validateCreate({ metadata: {} })).toHaveLength(3);
    expect(
      plugin.validateCreate({
        metadata: {
          completed: 'VT-1 task',
          actorId: 'window-user',
          occurredAt: '2026-07-06T01:00:00.000Z',
        },
      }),
    ).toEqual([]);
  });

  it('rejects invalid occurredAt', () => {
    const plugin = createLoopEntryPlugin();
    const details = plugin.validateCreate({
      metadata: {
        completed: 'VT-1 task',
        actorId: 'window-user',
        occurredAt: 'not-a-date',
      },
    });

    expect(details.some((detail) => detail.field === 'metadata.occurredAt')).toBe(true);
  });
});
