import { describe, expect, it } from 'vitest';

import { buildOdptStationTimetableUrl, mapOdptDepartures } from './odpt-station-timetable.js';

describe('odpt-station-timetable', () => {
  it('builds ODPT timetable URL', () => {
    const url = buildOdptStationTimetableUrl({
      consumerKey: 'test-key',
      stationId: 'odpt.Station:TokyoMetro.Ginza.Ginza',
      operatorId: 'odpt.Operator:TokyoMetro',
    });

    expect(url).toContain('api.odpt.org');
    expect(url).toContain('acl%3AconsumerKey=test-key');
    expect(url).toContain('odpt.Station%3ATokyoMetro.Ginza.Ginza');
  });

  it('maps ODPT payload into departure instants', () => {
    const departures = mapOdptDepartures(
      [
        {
          'odpt:stationTimetableObject': [
            { 'odpt:departureTime': '09:10' },
            { 'odpt:departureTime': '09:30' },
          ],
        },
      ],
      new Date('2026-07-09T12:00:00+09:00'),
      'Asia/Tokyo',
    );

    expect(departures).toHaveLength(2);
    expect(
      new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(departures[1]!),
    ).toBe('09:30');
  });
});
