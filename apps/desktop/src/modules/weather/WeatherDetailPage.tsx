import { hasWeatherData, adviseUmbrella } from '@urms/domain/perception';

import { useLifeState } from '../../hooks/useLifeState.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { WeatherIllustration } from './WeatherIllustration.js';

function umbrellaLevelClass(level: string): string {
  if (level === 'required') return 'umbrella-advice umbrella-advice--required';
  if (level === 'recommended') return 'umbrella-advice umbrella-advice--recommended';
  if (level === 'optional') return 'umbrella-advice umbrella-advice--optional';
  return 'umbrella-advice umbrella-advice--none';
}

export function WeatherDetailPage() {
  const life = useLifeState();
  const weather = life.state.weather;
  const hasData = hasWeatherData(weather);
  const advice = adviseUmbrella({
    precipitationPct: weather.precipitationPct,
    commuteWindowMaxPct: hasData ? Math.min(100, weather.precipitationPct + 15) : undefined,
    rainDurationMinutes: weather.precipitationPct >= 50 ? 45 : weather.precipitationPct >= 25 ? 15 : 0,
    hasOutgoingPlan: life.state.nextEvents.length > 0,
  });

  return (
    <ModuleScreenLayout screenId="M-WEA-DET" title="天気詳細" moduleLabel="天気">
      <section className="glass-card glass-card--weather-detail">
        <p className="card-kicker">いま</p>
        <div className="weather-detail__now">
          <WeatherIllustration illustrationId={weather.illustrationId} compact />
          <div className="weather-detail__metrics">
            {hasData ? (
              <>
                <p className="metric-large">{weather.tempC}°C</p>
                <p className="metric-detail">
                  降水 {weather.precipitationPct}% · 湿度 {weather.humidityPct}% · 風 {weather.windKmh}km/h
                </p>
                <p className="hint-line">{weather.hint}</p>
              </>
            ) : (
              <p className="hint-line">天気データは未取得です。API + 位置情報または SSOT 地点を設定してください。</p>
            )}
          </div>
        </div>
      </section>

      <section className={umbrellaLevelClass(advice.level)}>
        <p className="card-kicker">傘 · 外出アドバイス</p>
        <p className="umbrella-advice__headline">{advice.headline}</p>
        <p className="hint-line">{advice.detail}</p>
        <p className="hint-line">v0.2 — 降水量 · 時間帯 · 通勤/外出予定を主軸（Domain 正本）</p>
      </section>

      <section className="glass-card">
        <p className="card-kicker">時間別（拡張予定）</p>
        <p className="hint-line">
          Open-Meteo 時間別降水量 API 連携は S2 後半で追加。現在は現在値ベースの判断のみ。
        </p>
        <ul className="hourly-preview">
          {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((slot) => (
            <li key={slot} className="hourly-preview__row">
              <span>{slot}</span>
              <span>{hasData ? `${Math.max(0, weather.precipitationPct - 10)}–${Math.min(100, weather.precipitationPct + 10)}%` : '—'}</span>
            </li>
          ))}
        </ul>
      </section>
    </ModuleScreenLayout>
  );
}
