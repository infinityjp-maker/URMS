import { describe, expect, it } from 'vitest';

import { buildWeatherHint } from './weather-hint.js';

describe('buildWeatherHint', () => {
  it('suggests umbrella when precipitation is high', () => {
    expect(
      buildWeatherHint({ tempC: 20, precipitationPct: 70, humidityPct: 60, windKmh: 5 }),
    ).toContain('傘');
  });

  it('returns calm hint for mild weather', () => {
    expect(
      buildWeatherHint({ tempC: 22, precipitationPct: 10, humidityPct: 55, windKmh: 8 }),
    ).toBe('穏やかな天気です');
  });
});
