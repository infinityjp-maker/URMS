import { describe, expect, it } from 'vitest';

import { toResourceEntity } from '../mappers/resource-mapper.js';

describe('resource-mapper', () => {
  it('maps prisma row to domain entity', () => {
    const createdAt = new Date('2026-07-05T00:00:00.000Z');
    const updatedAt = new Date('2026-07-05T01:00:00.000Z');

    const entity = toResourceEntity({
      id: 'cuid-1',
      resourceType: 'physical',
      resourceId: 'server-01',
      name: 'Server 01',
      status: 'active',
      metadata: { zone: 'east' },
      createdAt,
      updatedAt,
      createdBy: null,
      updatedBy: null,
    });

    expect(entity).toEqual({
      resourceType: 'physical',
      resourceId: 'server-01',
      name: 'Server 01',
      status: 'active',
      metadata: { zone: 'east' },
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});
