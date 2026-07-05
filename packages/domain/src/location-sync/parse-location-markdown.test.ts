import { describe, expect, it } from 'vitest';

import { parseLocationMarkdown } from './parse-location-markdown.js';

const homeSample = `# 東京（自宅）

> **resource_type:** location
> **resource_id:** location:home
> **latitude:** 35.6762
> **longitude:** 139.6503
> **timezone:** Asia/Tokyo
> **primary:** true

天気 API の参照地点 SSOT
`;

describe('parseLocationMarkdown', () => {
  it('parses location coordinates for weather SSOT', () => {
    const parsed = parseLocationMarkdown(homeSample, '.cursor/resources/location/home.md', 'home');

    expect(parsed).toEqual({
      resourceType: 'location',
      resourceId: 'home',
      name: '東京（自宅）',
      sourcePath: '.cursor/resources/location/home.md',
      contentHash: expect.any(String),
      metadata: {
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
        primary: true,
      },
    });
  });

  it('returns null when coordinates are missing', () => {
    expect(
      parseLocationMarkdown(
        `# Broken

> **resource_type:** location
> **resource_id:** location:broken
`,
        'broken.md',
        'broken',
      ),
    ).toBeNull();
  });
});
