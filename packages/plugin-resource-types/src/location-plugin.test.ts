import { describe, expect, it } from 'vitest';

import { createLocationPlugin } from './location-plugin.js';

describe('createLocationPlugin', () => {
  it('requires latitude and longitude on create', () => {
    const plugin = createLocationPlugin();
    expect(plugin.validateCreate({ resourceId: 'loc-1', name: 'Tokyo', metadata: {} })).toHaveLength(1);
    expect(
      plugin.validateCreate({
        resourceId: 'loc-1',
        name: 'Tokyo',
        metadata: { latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
      }),
    ).toEqual([]);
  });
});
