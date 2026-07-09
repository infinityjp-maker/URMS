import type { PerceptionState } from '@urms/shared';

/** 開発デモ用（本番窓では使わない · SSOT 原則） */
export const DEV_DEMO_FIXTURES = {
  weather: {
    tempC: 22,
    precipitationPct: 30,
    humidityPct: 78,
    windKmh: 12,
    hint: '傘を持っていくと安心です',
    weatherCode: 2,
    isDay: true,
    illustrationId: 'partly-cloudy' as const,
  },
  nextEvents: [
    { time: '09:30', title: 'プロジェクト定例', note: 'あと 1h 48m', tone: 'calm' as const },
    { time: '13:00', title: '田中さんとランチ', tone: 'warm' as const },
    { time: '16:30', title: '資料レビュー', note: '集中時間推奨', tone: 'focus' as const },
  ],
};

/** @deprecated DEV_DEMO_FIXTURES を使用。テスト互換のエイリアス */
export const PERCEPTION_FIXTURES = {
  weather: DEV_DEMO_FIXTURES.weather,
  nextEvents: DEV_DEMO_FIXTURES.nextEvents,
  summary: {
    conditionScore: 72,
    events: 2,
    tasks: 3,
    focusHours: 5.2,
    travelMinutes: 70,
  },
};

export const EMPTY_WEATHER: PerceptionState['weather'] = {
  tempC: 0,
  precipitationPct: 0,
  humidityPct: 0,
  windKmh: 0,
  hint: '天気データは未取得です',
  isDay: true,
  illustrationId: 'unknown',
};

export function hasWeatherData(weather: PerceptionState['weather']): boolean {
  return weather.hint !== EMPTY_WEATHER.hint;
}
