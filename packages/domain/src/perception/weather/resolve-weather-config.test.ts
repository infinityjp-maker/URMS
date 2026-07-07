import { describe, expect, it, vi } from 'vitest';

import {
  pickPrimaryLocation,
  pickPrimaryLocationLabel,
  resolvePrimaryLocationLabelForMode,
} from './resolve-weather-config.js';

describe('pickPrimaryLocationLabel', () => {
  it('prefers primary location resource name', () => {
    expect(
      pickPrimaryLocationLabel([
        { name: '副地点', metadata: { primary: false, latitude: 1, longitude: 2 } },
        { name: '自宅', metadata: { primary: true, latitude: 35, longitude: 139 } },
      ] as never[]),
    ).toBe('自宅');
  });

  it('reads stored place name from metadata', () => {
    expect(
      pickPrimaryLocation([
        {
          name: '自宅',
          metadata: {
            primary: true,
            latitude: 35.6762,
            longitude: 139.6503,
            placeName: '東京都渋谷区',
          },
        },
      ] as never[]),
    ).toMatchObject({
      label: '自宅',
      placeName: '東京都渋谷区',
    });
  });

  it('falls back to first location when none is primary', () => {
    expect(
      pickPrimaryLocationLabel([
        { name: 'オフィス', metadata: { latitude: 34.69, longitude: 135.5 } },
      ] as never[]),
    ).toBe('オフィス');
  });
});

describe('resolvePrimaryLocationLabelForMode', () => {
  it('returns null when reader is unavailable', async () => {
    await expect(resolvePrimaryLocationLabelForMode(undefined, 'operate')).resolves.toBeNull();
  });

  it('reads active location resources through service reader', async () => {
    const reader = {
      list: vi.fn(async () => ({
        items: [{ name: '自宅', metadata: { primary: true, latitude: 35.6, longitude: 139.6 } }],
      })),
    };

    await expect(resolvePrimaryLocationLabelForMode(reader, 'operate')).resolves.toBe('自宅');
  });
});
