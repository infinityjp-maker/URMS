import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useWeatherWeekly } from '../../hooks/useWeatherWeekly.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { WeatherIcon } from './WeatherIcon.js';

function formatDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${Number.parseInt(month ?? '0', 10)}/${Number.parseInt(day ?? '0', 10)}`;
}

export function WeatherWeeklyPage() {
  const life = useLifeState();
  const weekly = useWeatherWeekly({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-WEA-WK" title="週間予報" moduleLabel="天気">
      <section className="glass-card glass-card--accent">
        <p className="card-kicker">7 日間</p>
        {weekly.loading ? (
          <p className="hint-line">週間予報を取得中…</p>
        ) : weekly.payload && weekly.payload.days.length > 0 ? (
          <>
            <p className="metric-detail">{weekly.payload.timezone} · 降水確率 · 最高/最低</p>
            <ul className="weather-weekly-rows">
              {weekly.payload.days.map((day) => (
                <li key={day.dateKey} className="weather-weekly-row">
                  <div className="weather-weekly-row__date">
                    <span className="weather-weekly-row__weekday">{day.weekdayLabel}</span>
                    <span className="weather-weekly-row__day">{formatDateLabel(day.dateKey)}</span>
                  </div>
                  <WeatherIcon illustrationId={day.illustrationId} size="sm" />
                  <span className="weather-weekly-row__temps">
                    {day.tempMaxC}° / {day.tempMinC}°
                  </span>
                  <span className="weather-weekly-row__precip">
                    {day.precipitationPct}%
                    {day.precipitationMm > 0 ? ` · ${day.precipitationMm}mm` : ''}
                  </span>
                  <p className="weather-weekly-row__summary">{day.summary}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {weekly.error
              ? '天気データ未取得 — API 起動 · 位置情報を確認してください'
              : '週間予報を取得できません'}
          </p>
        )}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-WEA-DET')} className="text-link">
          ← 天気詳細に戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
