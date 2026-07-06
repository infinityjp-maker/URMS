import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from './context-defaults.js';
import { buildPerceptionState } from '../perception/build-perception-state.js';

describe('buildDefaultContextDashboard', () => {
  it('seeds Vision Track summaries for the perception window', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard);

    expect(dashboard.items).toHaveLength(6);
    expect(state.statusLine).toContain('Vision 体験');
    expect(state.tasks).toEqual([
      'VT-2 — Context 脳（地点 · グラフ · 時間から「今」を合成）',
      'VT-4 — 日次ループ narrative · journal 連続性',
    ]);
    expect(state.aiMemo).toContain('VT-4');
  });
});
