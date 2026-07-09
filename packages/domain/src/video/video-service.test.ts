import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { catalogVideos, findVideoEntry } from './video-catalog.js';
import { createVideoService } from './video-service.js';

const sampleVideo: ResourceEntity = {
  resourceType: 'digital',
  resourceId: 'clip-01',
  name: 'Test Clip',
  status: 'active',
  metadata: {
    videoKind: 'export',
    path: 'D:\\Clips\\test.mp4',
    durationMin: 5,
    sizeGb: 0.5,
    resolution: '1920x1080',
    codec: 'H.264',
    tags: ['test'],
    storageHint: 'Keep on D:',
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('video catalog', () => {
  it('lists curated videos', () => {
    expect(catalogVideos().length).toBeGreaterThan(2);
  });

  it('finds catalog entry by id', () => {
    expect(findVideoEntry('vid-urms-demo')?.title).toContain('URMS');
  });
});

describe('video service', () => {
  it('falls back to catalog when no resource videos', async () => {
    const resourceService = {
      list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      getByRef: vi.fn(),
    };
    const service = createVideoService({ resourceService: resourceService as never });

    const library = await service.getLibrary('operate');
    expect(library.source).toBe('catalog');
    expect(library.items.length).toBeGreaterThan(0);
  });

  it('uses digital resources with videoKind metadata', async () => {
    const resourceService = {
      list: vi.fn(async () => ({ items: [sampleVideo], total: 1, page: 1, limit: 64 })),
      getByRef: vi.fn(async () => sampleVideo),
    };
    const service = createVideoService({ resourceService: resourceService as never });

    const library = await service.getLibrary('operate');
    expect(library.source).toBe('resource');
    expect(library.items[0]?.id).toBe('clip-01');

    const detail = await service.getVideo('clip-01', 'operate');
    expect(detail?.codec).toBe('H.264');
  });

  it('returns catalog detail when resource lookup fails', async () => {
    const resourceService = {
      list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 64 })),
      getByRef: vi.fn(async () => {
        throw new Error('not found');
      }),
    };
    const service = createVideoService({ resourceService: resourceService as never });

    const detail = await service.getVideo('vid-trip-raw', 'operate');
    expect(detail?.kind).toBe('raw');
    expect(detail?.storageHint).toContain('raw');
  });
});
