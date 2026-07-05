import { describe, expect, it } from 'vitest';

import { layoutForPhase } from './phaseLayout.js';

describe('layoutForPhase', () => {
  it('compresses information at night', () => {
    const layout = layoutForPhase('night');
    expect(layout.gridMode).toBe('minimal');
    expect(layout.showWeather).toBe(false);
    expect(layout.maxEvents).toBe(0);
  });

  it('shows full dashboard during day', () => {
    const layout = layoutForPhase('day');
    expect(layout.gridMode).toBe('full');
    expect(layout.showTasks).toBe(true);
    expect(layout.maxEvents).toBe(3);
  });
});
