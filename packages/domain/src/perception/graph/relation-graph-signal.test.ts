import { describe, expect, it, vi } from 'vitest';

import {
  countRelationsByType,
  formatRelationGraphNote,
  resolveRelationGraphSignal,
} from './relation-graph-signal.js';

describe('countRelationsByType', () => {
  it('groups relations by type', () => {
    expect(
      countRelationsByType([
        { relationType: 'depends_on' },
        { relationType: 'depends_on' },
        { relationType: 'member_of' },
      ] as never[]),
    ).toEqual({
      depends_on: 2,
      member_of: 1,
    });
  });
});

describe('formatRelationGraphNote', () => {
  it('returns null when no relations', () => {
    expect(formatRelationGraphNote({ activeRelations: 0, byType: {} })).toBeNull();
  });

  it('includes top relation types', () => {
    expect(
      formatRelationGraphNote({
        activeRelations: 3,
        byType: { depends_on: 2, member_of: 1 },
      }),
    ).toBe('関係 3 · depends_on 2 · member_of 1');
  });
});

describe('resolveRelationGraphSignal', () => {
  it('returns relation count and type breakdown from service', async () => {
    const relationService = {
      list: vi.fn(async () => [
        { id: '1', relationType: 'depends_on' },
        { id: '2', relationType: 'depends_on' },
        { id: '3', relationType: 'member_of' },
      ]),
    };

    await expect(resolveRelationGraphSignal(relationService, 'operate')).resolves.toEqual({
      activeRelations: 3,
      byType: { depends_on: 2, member_of: 1 },
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
      byType: {},
    });
  });
});
