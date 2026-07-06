import { describe, expect, it } from 'vitest';

import { formatWeatherCoordHint } from './weather-coord-hint.js';

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
