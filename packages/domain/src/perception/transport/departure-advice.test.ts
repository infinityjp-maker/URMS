import { describe, expect, it } from 'vitest';

import { adviseDeparture, buildStationDeparturesForDay, formatClockTime } from './departure-advice.js';

describe('buildStationDeparturesForDay', () => {
  it('generates interval departures', () => {
    const departures = buildStationDeparturesForDay(
      new Date('2026-07-09T12:00:00+09:00'),
      'Asia/Tokyo',
      30,
      8,
      9,
    );

    expect(departures).toHaveLength(4);
    expect(formatClockTime(departures[0]!, 'Asia/Tokyo')).toBe('08:00');
    expect(formatClockTime(departures[3]!, 'Asia/Tokyo')).toBe('09:30');
  });
});

describe('adviseDeparture', () => {
  const config = {
    stationName: '渋谷',
    walkToStationMinutes: 8,
    bufferMinutes: 5,
    rideMinutes: 25,
    spareCoffeeThresholdMinutes: 10,
    timezone: 'Asia/Tokyo',
  } as const;

  it('returns leave-home advice for upcoming outgoing event', () => {
    const now = new Date('2026-07-09T09:00:00+09:00');
    const eventStart = new Date('2026-07-09T10:00:00+09:00');
    const stationDepartures = buildStationDeparturesForDay(now, 'Asia/Tokyo', 10);

    const advice = adviseDeparture({
      eventTitle: '定例',
      eventStart,
      now,
      stationDepartures,
      config,
    });

    expect(advice).toMatchObject({
      eventTitle: '定例',
      eventTime: '10:00',
      recommendedTrainDeparture: '09:30',
      leaveHomeBy: '09:17',
      leaveInMinutes: 17,
    });
    expect(advice?.spareSuggestion).toContain('缶コーヒー');
  });

  it('returns undefined when event already started', () => {
    const now = new Date('2026-07-09T10:05:00+09:00');
    const advice = adviseDeparture({
      eventTitle: '定例',
      eventStart: new Date('2026-07-09T10:00:00+09:00'),
      now,
      stationDepartures: buildStationDeparturesForDay(now, 'Asia/Tokyo', 10),
      config,
    });

    expect(advice).toBeUndefined();
  });
});
