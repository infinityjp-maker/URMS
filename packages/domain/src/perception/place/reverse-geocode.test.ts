import { describe, expect, it, vi } from 'vitest';

import { formatPlaceName, reverseGeocodePlaceName } from './reverse-geocode.js';

describe('formatPlaceName', () => {
  it('combines city and locality for Japanese addresses', () => {
    expect(
      formatPlaceName({
        city: '東京都',
        locality: '渋谷区',
      }),
    ).toBe('東京都渋谷区');
  });

  it('uses locality alone when city is missing', () => {
    expect(formatPlaceName({ locality: '横浜市' })).toBe('横浜市');
  });
});

describe('reverseGeocodePlaceName', () => {
  it('returns formatted place name from API payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ city: '東京都', locality: '渋谷区' }),
    })) as unknown as typeof fetch;

    await expect(
      reverseGeocodePlaceName(35.6762, 139.6503, { fetchImpl }),
    ).resolves.toBe('東京都渋谷区');
  });

  it('returns null when API fails', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false })) as unknown as typeof fetch;

    await expect(reverseGeocodePlaceName(0, 0, { fetchImpl })).resolves.toBeNull();
  });
});
