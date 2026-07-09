import { describe, expect, it } from 'vitest';

import { adviseUmbrella } from './umbrella-advice.js';

describe('adviseUmbrella', () => {
  it('returns none for low precipitation', () => {
    const advice = adviseUmbrella({ precipitationPct: 10 });
    expect(advice.level).toBe('none');
    expect(advice.headline).toContain('不要');
  });

  it('returns optional for moderate drizzle outside commute', () => {
    const advice = adviseUmbrella({ precipitationPct: 30, rainDurationMinutes: 10 });
    expect(advice.level).toBe('optional');
  });

  it('returns required when commute window overlaps high precipitation', () => {
    const advice = adviseUmbrella({
      precipitationPct: 45,
      commuteWindowMaxPct: 55,
    });
    expect(advice.level).toBe('required');
    expect(advice.detail).toContain('通勤');
  });

  it('returns required when outgoing plan and elevated precipitation', () => {
    const advice = adviseUmbrella({
      precipitationPct: 40,
      hasOutgoingPlan: true,
    });
    expect(advice.level).toBe('required');
  });
});
