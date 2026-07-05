import { describe, expect, it } from 'vitest';

import { resolveDayPhase } from './day-phase.js';

describe('resolveDayPhase', () => {
  it('returns morning for early hours', () => {
    expect(resolveDayPhase(new Date('2026-07-05T07:00:00'))).toBe('morning');
  });

  it('returns day for business hours', () => {
    expect(resolveDayPhase(new Date('2026-07-05T14:00:00'))).toBe('day');
  });
});
