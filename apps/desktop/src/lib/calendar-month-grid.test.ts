import { buildMonthDateKeys, weekdayIndexForDateKey } from './calendar-month-grid.js';
import { describe, expect, it } from 'vitest';

describe('calendar-month-grid', () => {
  it('builds all days in month', () => {
    expect(buildMonthDateKeys(2026, 7)).toHaveLength(31);
    expect(buildMonthDateKeys(2026, 7)[0]).toBe('2026-07-01');
  });

  it('resolves weekday index', () => {
    expect(weekdayIndexForDateKey('2026-07-01', 'Asia/Tokyo')).toBeGreaterThanOrEqual(0);
  });
});
