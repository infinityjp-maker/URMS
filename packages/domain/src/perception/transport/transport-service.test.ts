import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTransportService } from './transport-service.js';

describe('ResourceTransportService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns advice for next outgoing schedule event', async () => {
    vi.stubEnv('URMS_SCHEDULE_ENABLED', 'true');
    const resourceService = {
      list: vi.fn().mockResolvedValue({
        items: [
          {
            resourceId: 'sched-1',
            name: '定例',
            metadata: { recurrence: 'daily', time: '10:00', tone: 'focus' },
          },
        ],
      }),
    };

    const service = createTransportService({
      resourceService: resourceService as never,
      config: {
        enabled: true,
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
        walkToStationMinutes: 8,
        bufferMinutes: 5,
        rideMinutes: 25,
        spareCoffeeThresholdMinutes: 10,
        departureIntervalMinutes: 10,
      },
    });

    const payload = await service.getDepartureAdvice('operate', new Date('2026-07-09T09:00:00+09:00'));

    expect(payload.advice?.eventTitle).toBe('定例');
    expect(payload.advice?.recommendedTrainDeparture).toBe('09:30');
    expect(payload.route?.estimatedArrival).toBe('09:55');
    expect(payload.note).toBeNull();
  });

  it('returns empty note when no outgoing events', async () => {
    vi.stubEnv('URMS_SCHEDULE_ENABLED', 'true');
    const resourceService = {
      list: vi.fn().mockResolvedValue({
        items: [
          {
            resourceId: 'sched-tv',
            name: 'TV視聴',
            metadata: { recurrence: 'daily', time: '21:00' },
          },
        ],
      }),
    };

    const service = createTransportService({
      resourceService: resourceService as never,
      config: {
        enabled: true,
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
        walkToStationMinutes: 8,
        bufferMinutes: 5,
        rideMinutes: 25,
        spareCoffeeThresholdMinutes: 10,
        departureIntervalMinutes: 10,
      },
    });

    const payload = await service.getDepartureAdvice('operate', new Date('2026-07-09T09:00:00+09:00'));
    expect(payload.advice).toBeNull();
    expect(payload.note).toContain('外出');
  });
});
