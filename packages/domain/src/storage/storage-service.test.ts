import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { catalogVolumes, findStorageVolume } from './storage-catalog.js';
import { createStorageService } from './storage-service.js';

const sampleVolume: ResourceEntity = {
  resourceType: 'digital',
  resourceId: 'disk-d',
  name: 'Data Drive D',
  status: 'active',
  metadata: {
    vendor: 'Samsung',
    storageKind: 'data',
    path: 'D:\\Data',
    totalGb: 1000,
    usedGb: 400,
    notes: 'Projects volume',
    cleanupHint: 'Clear build caches',
    largestItems: [{ label: 'URMS', sizeGb: 5 }],
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('storage catalog', () => {
  it('lists curated volumes', () => {
    expect(catalogVolumes().length).toBeGreaterThan(2);
  });

  it('finds volume by id', () => {
    expect(findStorageVolume('vol-system')?.kind).toBe('system');
  });
});

describe('ResourceStorageService', () => {
  it('falls back to catalog when no storage resources', async () => {
    const service = createStorageService({
      resourceService: {
        list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      } as never,
    });

    const overview = await service.getOverview('operate');
    expect(overview.source).toBe('catalog');
    expect(overview.volumes.length).toBeGreaterThan(0);
    expect(overview.totalCapacityGb).toBeGreaterThan(0);
  });

  it('maps digital storage resources when present', async () => {
    const service = createStorageService({
      resourceService: {
        list: vi.fn(async () => ({ items: [sampleVolume], total: 1, page: 1, limit: 64 })),
        getByRef: vi.fn(async () => sampleVolume),
      } as never,
    });

    const overview = await service.getOverview('operate');
    expect(overview.source).toBe('resource');
    expect(overview.volumes[0]?.name).toBe('Data Drive D');
    expect(overview.volumes[0]?.usagePct).toBe(40);

    const detail = await service.getVolume('disk-d', 'operate');
    expect(detail?.largestItems[0]?.label).toBe('URMS');
  });

  it('returns catalog volume detail by id', async () => {
    const service = createStorageService({
      resourceService: {
        list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      } as never,
    });

    const detail = await service.getVolume('vol-media', 'operate');
    expect(detail?.kind).toBe('archive');
    expect(detail?.largestItems.length).toBeGreaterThan(0);
  });
});
