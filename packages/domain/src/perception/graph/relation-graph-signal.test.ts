import { describe, expect, it, vi } from 'vitest';

import { resolveRelationGraphSignal } from './relation-graph-signal.js';

describe('resolveRelationGraphSignal', () => {
  it('returns relation count from service', async () => {
    const relationService = {
      list: vi.fn(async () => [{ id: '1' }, { id: '2' }]),
    };

    await expect(resolveRelationGraphSignal(relationService, 'operate')).resolves.toEqual({
      activeRelations: 2,
    });
  });

  it('returns zero when list fails', async () => {
    const relationService = {
      list: vi.fn(async () => {
        throw new Error('db down');
      }),
    };

    await expect(resolveRelationGraphSignal(relationService, 'operate')).resolves.toEqual({
      activeRelations: 0,
    });
  });
});
