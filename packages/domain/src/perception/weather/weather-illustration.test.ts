import { describe, expect, it } from 'vitest';

import { resolveWeatherIllustration, weatherIllustrationLabel } from './weather-illustration.js';

describe('resolveWeatherIllustration', () => {
  it('maps clear sky to day/night variants', () => {
    expect(resolveWeatherIllustration(0, true, 0)).toBe('clear-day');
    expect(resolveWeatherIllustration(0, false, 0)).toBe('clear-night');
  });

  it('maps rain codes', () => {
    expect(resolveWeatherIllustration(61, true, 80)).toBe('rain');
    expect(resolveWeatherIllustration(95, true, 90)).toBe('thunderstorm');
  });

  it('falls back from precipitation when code missing', () => {
    expect(resolveWeatherIllustration(undefined, true, 70)).toBe('rain');
  });
});

describe('weatherIllustrationLabel', () => {
  it('returns Japanese label', () => {
    expect(weatherIllustrationLabel('rain')).toBe('雨');
  });
});
