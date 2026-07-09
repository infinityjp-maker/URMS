import { describe, expect, it } from 'vitest';

import { adviseEventLeadTime, resolveScheduleEventCategory } from './event-lead-time.js';

describe('resolveScheduleEventCategory', () => {
  it('detects reservation from title', () => {
    expect(resolveScheduleEventCategory('イタリアンレストラン予約')).toBe('reservation');
  });

  it('detects outgoing from meeting keywords', () => {
    expect(resolveScheduleEventCategory('プロジェクト定例')).toBe('outgoing');
  });

  it('detects tv from viewing keywords', () => {
    expect(resolveScheduleEventCategory('ニュース視聴')).toBe('tv');
  });

  it('uses tone as fallback', () => {
    expect(resolveScheduleEventCategory('作業', undefined, 'focus')).toBe('outgoing');
  });
});

describe('adviseEventLeadTime', () => {
  it('advises shortly before tv events', () => {
    const now = new Date('2026-07-05T09:20:00+09:00');
    const start = new Date('2026-07-05T09:30:00+09:00');
    const advice = adviseEventLeadTime('tv', start, now);
    expect(advice?.headline).toBe('まもなく開始');
  });

  it('advises reservation confirmation days ahead', () => {
    const now = new Date('2026-07-05T10:00:00+09:00');
    const start = new Date('2026-07-07T18:00:00+09:00');
    const advice = adviseEventLeadTime('reservation', start, now);
    expect(advice?.headline).toBe('予約確認のタイミング');
  });

  it('advises departure for outgoing within 30 minutes', () => {
    const now = new Date('2026-07-05T09:10:00+09:00');
    const start = new Date('2026-07-05T09:30:00+09:00');
    const advice = adviseEventLeadTime('outgoing', start, now);
    expect(advice?.headline).toBe('そろそろ出発');
  });

  it('returns undefined for past events', () => {
    const now = new Date('2026-07-05T10:00:00+09:00');
    const start = new Date('2026-07-05T09:00:00+09:00');
    expect(adviseEventLeadTime('outgoing', start, now)).toBeUndefined();
  });
});
