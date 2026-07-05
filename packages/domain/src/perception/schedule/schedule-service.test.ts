import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { PERCEPTION_FIXTURES } from '../fixtures.js';
import { createScheduleService } from './schedule-service.js';

const sampleEvent: ResourceEntity = {
  resourceType: 'schedule',
  resourceId: 'daily-standup',
  name: 'デイリー',
  status: 'active',
  metadata: { startAt: '2026-07-05T10:00:00+09:00' },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('ResourceScheduleService', () => {
  it('returns fixture events when disabled', async () => {
    const service = createScheduleService({
      resourceService: { list: vi.fn() } as never,
      config: { enabled: false, timezone: 'Asia/Tokyo', limit: 8 },
    });

    await expect(service.getTodayEvents('operate')).resolves.toEqual(PERCEPTION_FIXTURES.nextEvents);
  });

  it('loads today events from schedule resources', async () => {
    const list = vi.fn(async () => ({ items: [sampleEvent], total: 1, page: 1, limit: 8 }));
    const service = createScheduleService({
      resourceService: { list } as never,
      config: { enabled: true, timezone: 'Asia/Tokyo', limit: 8 },
    });

    const events = await service.getTodayEvents('operate', new Date('2026-07-05T08:00:00+09:00'));
    expect(list).toHaveBeenCalledWith(
      { resourceType: 'schedule', status: 'active', limit: 8 },
      'operate',
    );
    expect(events[0]?.title).toBe('デイリー');
    expect(events[0]?.time).toBe('10:00');
  });

  it('falls back to fixtures when list fails', async () => {
    const service = createScheduleService({
      resourceService: {
        list: vi.fn(async () => {
          throw new Error('db down');
        }),
      } as never,
      config: { enabled: true, timezone: 'Asia/Tokyo', limit: 8 },
    });

    await expect(service.getTodayEvents('operate')).resolves.toEqual(PERCEPTION_FIXTURES.nextEvents);
  });
});
