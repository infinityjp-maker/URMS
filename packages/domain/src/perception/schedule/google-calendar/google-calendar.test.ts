import { describe, expect, it } from 'vitest';

import { mergeCalendarMonthDays, mapGoogleEventsToMonthDays } from './map-google-events.js';
import { filterIcsEventsForMonth, parseIcsEvents } from './parse-ics.js';

const SAMPLE_ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:evt-1
SUMMARY:定例ミーティング
DTSTART:20260709T100000
DESCRIPTION:Google予定
END:VEVENT
BEGIN:VEVENT
UID:evt-2
SUMMARY:TV視聴
DTSTART:20260710T210000
END:VEVENT
END:VCALENDAR`;

describe('parseIcsEvents', () => {
  it('parses VEVENT blocks', () => {
    const events = parseIcsEvents(SAMPLE_ICS, 'Asia/Tokyo');
    expect(events).toHaveLength(2);
    expect(events[0]?.title).toBe('定例ミーティング');
  });

  it('filters events for target month', () => {
    const events = parseIcsEvents(SAMPLE_ICS, 'Asia/Tokyo');
    const july = filterIcsEventsForMonth(events, 2026, 7, 'Asia/Tokyo');
    expect(july).toHaveLength(2);
    const august = filterIcsEventsForMonth(events, 2026, 8, 'Asia/Tokyo');
    expect(august).toHaveLength(0);
  });
});

describe('mapGoogleEventsToMonthDays', () => {
  it('maps events into day buckets', () => {
    const events = parseIcsEvents(SAMPLE_ICS, 'Asia/Tokyo');
    const days = mapGoogleEventsToMonthDays(events, new Date('2026-07-09T08:00:00+09:00'), 'Asia/Tokyo');
    expect(days['2026-07-09']).toHaveLength(1);
    expect(days['2026-07-09']?.[0]?.resourceId).toBe('google:evt-1');
  });
});

describe('mergeCalendarMonthDays', () => {
  it('merges local and google events per day', () => {
    const local = {
      '2026-07-09': [
        {
          time: '09:00',
          title: 'ローカル',
          tone: 'calm' as const,
          resourceId: 'local-1',
          category: 'tv' as const,
        },
      ],
    };
    const google = {
      '2026-07-09': [
        {
          time: '10:00',
          title: 'Google',
          tone: 'focus' as const,
          resourceId: 'google:evt-1',
          category: 'outgoing' as const,
        },
      ],
    };

    const merged = mergeCalendarMonthDays(local, google);
    expect(merged['2026-07-09']).toHaveLength(2);
    expect(merged['2026-07-09']?.[0]?.title).toBe('ローカル');
  });
});
