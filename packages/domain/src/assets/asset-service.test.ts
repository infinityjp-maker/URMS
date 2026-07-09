import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { catalogAssets, findAssetCatalogEntry } from './asset-catalog.js';
import { createAssetService } from './asset-service.js';

const sampleGpu: ResourceEntity = {
  resourceType: 'physical',
  resourceId: 'gpu-custom',
  name: 'Custom GPU',
  status: 'active',
  metadata: {
    location: 'rack-a',
    category: 'pc-part',
    partType: 'gpu',
    assetTag: 'GPU-99',
    budgetJpy: 90000,
    notes: 'Custom build GPU',
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('asset catalog', () => {
  it('lists curated assets', () => {
    expect(catalogAssets().length).toBeGreaterThan(3);
  });

  it('finds pc part by id', () => {
    expect(findAssetCatalogEntry('gpu-rtx4070')?.partType).toBe('gpu');
  });
});

describe('ResourceAssetService', () => {
  it('falls back to catalog when resource list is empty', async () => {
    const service = createAssetService({
      resourceService: {
        list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      } as never,
    });

    const payload = await service.listAssets('operate');
    expect(payload.source).toBe('catalog');
    expect(payload.assets.length).toBeGreaterThan(0);
  });

  it('maps physical resources when present', async () => {
    const service = createAssetService({
      resourceService: {
        list: vi.fn(async () => ({ items: [sampleGpu], total: 1, page: 1, limit: 64 })),
        getByRef: vi.fn(async () => sampleGpu),
      } as never,
    });

    const payload = await service.listAssets('operate');
    expect(payload.source).toBe('resource');
    expect(payload.assets[0]?.name).toBe('Custom GPU');
    expect(payload.assets[0]?.partType).toBe('gpu');

    const detail = await service.getAsset('gpu-custom', 'operate');
    expect(detail?.assetTag).toBe('GPU-99');
  });

  it('lists pc parts and budget total', async () => {
    const service = createAssetService({
      resourceService: {
        list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      } as never,
    });

    const payload = await service.listPcParts('operate');
    expect(payload.parts.length).toBeGreaterThan(0);
    expect(payload.roadmap.length).toBeGreaterThan(0);
    expect(payload.totalBudgetJpy).toBeGreaterThan(0);
  });
});
