import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveDeviceLocation } from '../lib/device-location.js';

describe('resolveDeviceLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns coordinates when geolocation succeeds', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            coords: { latitude: 35.01, longitude: 135.77 },
          } as GeolocationPosition);
        },
      },
    });

    await expect(resolveDeviceLocation()).resolves.toEqual({
      latitude: 35.01,
      longitude: 135.77,
    });
  });

  it('returns null when geolocation is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    await expect(resolveDeviceLocation()).resolves.toBeNull();
  });
});
