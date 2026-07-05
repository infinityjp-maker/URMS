import { describe, expect, it } from 'vitest';

import { parseScheduleMarkdown } from './parse-schedule-markdown.js';

const dailySample = `# URMS 朝チェックイン

> **resource_type:** schedule
> **resource_id:** schedule:urms-morning
> **recurrence:** daily
> **time:** 09:30
> **timezone:** Asia/Tokyo
> **tone:** focus

Vision Track · 進捗 Canvas 確認
`;

describe('parseScheduleMarkdown', () => {
  it('parses daily recurrence schedule resources', () => {
    const parsed = parseScheduleMarkdown(dailySample, '.cursor/resources/schedule/urms-morning.md', 'urms-morning');

    expect(parsed).toEqual({
      resourceType: 'schedule',
      resourceId: 'urms-morning',
      name: 'URMS 朝チェックイン',
      sourcePath: '.cursor/resources/schedule/urms-morning.md',
      contentHash: expect.any(String),
      metadata: {
        recurrence: 'daily',
        time: '09:30',
        timezone: 'Asia/Tokyo',
        tone: 'focus',
        note: 'Vision Track · 進捗 Canvas 確認',
      },
    });
  });

  it('parses one-off startAt schedules', () => {
    const parsed = parseScheduleMarkdown(
      `# リリースレビュー

> **resource_type:** schedule
> **resource_id:** schedule:release-review
> **startAt:** 2026-07-10T14:00:00+09:00
> **tone:** calm
`,
      'release.md',
      'release',
    );

    expect(parsed?.metadata.startAt).toBe('2026-07-10T14:00:00+09:00');
    expect(parsed?.resourceId).toBe('release-review');
  });

  it('returns null when schedule timing is missing', () => {
    expect(
      parseScheduleMarkdown(
        `# Broken

> **resource_type:** schedule
> **resource_id:** schedule:broken
`,
        'broken.md',
        'broken',
      ),
    ).toBeNull();
  });
});
