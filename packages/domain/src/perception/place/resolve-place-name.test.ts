import { describe, expect, it, vi } from 'vitest';

import { resolvePlaceName } from './resolve-place-name.js';

describe('resolvePlaceName', () => {
  it('uses stored place name for SSOT coords without reverse lookup', async () => {
    await expect(
      resolvePlaceName({ latitude: 35.6, longitude: 139.6 }, '東京都渋谷区', {}, false),
    ).resolves.toBe('東京都渋谷区');
  });

  it('reverse geocodes GPS coords even when SSOT place name exists', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ city: '大阪府', locality: '大阪市' }),
    })) as unknown as typeof fetch;

    await expect(
      resolvePlaceName(
        { latitude: 34.69, longitude: 135.5 },
        '東京都渋谷区',
        { fetchImpl },
        true,
      ),
    ).resolves.toBe('大阪府大阪市');
  });
});
