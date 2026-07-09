import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useWeatherWeekly } from '../../hooks/useWeatherWeekly.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { WeatherIllustration } from './WeatherIllustration.js';

function formatDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${Number.parseInt(month ?? '0', 10)}/${Number.parseInt(day ?? '0', 10)}`;
}

export function WeatherWeeklyPage() {
  const life = useLifeState();
  const weekly = useWeatherWeekly({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-WEA-WK" title="週間予報" moduleLabel="天気">
      <section className="glass-card">
        <p className="card-kicker">7 日間</p>
        {weekly.loading ? (
          <p className="hint-line">週間予報を取得中…</p>
        ) : weekly.payload && weekly.payload.days.length > 0 ? (
          <>
            <p className="metric-detail">
              Open-Meteo · {weekly.payload.timezone} · 降水確率 · 最高/最低気温
            </p>
            <ul className="weather-weekly-list">
              {weekly.payload.days.map((day) => (
                <li key={day.dateKey} className="weather-weekly-list__item">
                  <div className="weather-weekly-list__date">
                    <span className="weather-weekly-list__weekday">{day.weekdayLabel}</span>
                    <span className="weather-weekly-list__day">{formatDateLabel(day.dateKey)}</span>
                  </div>
                  <WeatherIllustration illustrationId={day.illustrationId} compact />
                  <div className="weather-weekly-list__metrics">
                    <span className="weather-weekly-list__temp">
                      {day.tempMaxC}° / {day.tempMinC}°
                    </span>
                    <span className="weather-weekly-list__precip">降水 {day.precipitationPct}%</span>
                    {day.precipitationMm > 0 ? (
                      <span className="weather-weekly-list__mm">{day.precipitationMm} mm</span>
                    ) : null}
                  </div>
                  <p className="weather-weekly-list__summary">{day.summary}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {weekly.error
              ? '天気データ未取得 — API 起動 · 位置情報または SSOT 地点を確認してください'
              : '週間予報を取得できません'}
          </p>
        )}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-WEA-DET')} className="module-shortcuts__link">
          天気詳細に戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
