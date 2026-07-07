import { describe, expect, it } from 'vitest';

import { formatWeatherCoordHint, formatWeatherLocationLabel } from './weather-coord-hint.js';

describe('formatWeatherLocationLabel', () => {
  it('shows resolved place name in API mode', () => {
    expect(formatWeatherLocationLabel('api', '東京都渋谷区')).toBe('東京都渋谷区');
  });

  it('shows dash when place name is unavailable', () => {
    expect(formatWeatherLocationLabel('api', null)).toBe('—');
  });

  it('omits label in local fallback mode', () => {
    expect(formatWeatherLocationLabel('local', '東京都渋谷区')).toBeNull();
  });
});

describe('formatWeatherCoordHint', () => {
  it('shows GPS label when device coords drive weather', () => {
    expect(formatWeatherCoordHint('api', 'device', true)).toBe('座標: GPS（ブラウザ位置情報）');
  });

  it('shows SSOT label when location resource drives weather', () => {
    expect(formatWeatherCoordHint('api', 'ssot', true)).toBe('座標: SSOT（地点リソース）');
  });

  it('shows dash when coord source is unknown', () => {
    expect(formatWeatherCoordHint('api', null, false)).toBe('座標: — · 天気未取得');
  });

  it('omits hint in local fallback mode', () => {
    expect(formatWeatherCoordHint('local', 'device', true)).toBeNull();
  });
});
