import type { PerceptionMeta } from '@urms/shared';

import type { LifeStateSource } from '../hooks/useLifeState.js';

/** VT-3 — 天気カード用の座標出所（接続カードと同じ正直表示） */
export function formatWeatherCoordHint(
  source: LifeStateSource,
  weatherCoords: PerceptionMeta['sources']['weatherCoords'] | null | undefined,
  hasLiveWeather: boolean,
): string | null {
  if (source !== 'api') {
    return null;
  }

  if (weatherCoords === 'device') {
    return hasLiveWeather ? '座標: GPS（ブラウザ位置情報）' : '座標: GPS · 天気未取得';
  }

  if (weatherCoords === 'ssot') {
    return hasLiveWeather ? '座標: SSOT（地点リソース）' : '座標: SSOT · 天気未取得';
  }

  return hasLiveWeather ? '座標: —' : '座標: — · 天気未取得';
}
