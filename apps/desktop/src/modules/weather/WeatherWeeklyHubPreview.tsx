import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useWeatherWeekly } from '../../hooks/useWeatherWeekly.js';
import { WeatherIllustration } from './WeatherIllustration.js';

export function WeatherWeeklyHubPreview() {
  const life = useLifeState();
  const weekly = useWeatherWeekly({ apiOnline: life.apiOnline });
  const previewDays = weekly.payload?.days.slice(0, 3) ?? [];

  return (
    <a href={screenHref('M-WEA-WK')} className="glass-card glass-card--link weather-weekly-hub">
      <p className="card-kicker">週間 · 予報へ</p>
      {weekly.loading ? (
        <p className="hint-line">週間予報を読み込み中…</p>
      ) : previewDays.length > 0 ? (
        <ul className="weather-weekly-hub__list">
          {previewDays.map((day) => (
            <li key={day.dateKey} className="weather-weekly-hub__item">
              <span className="weather-weekly-hub__weekday">{day.weekdayLabel}</span>
              <WeatherIllustration illustrationId={day.illustrationId} compact />
              <span className="weather-weekly-hub__temp">
                {day.tempMaxC}°/{day.tempMinC}°
              </span>
              <span className="weather-weekly-hub__precip">{day.precipitationPct}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint-line">週間予報未取得</p>
      )}
    </a>
  );
}
