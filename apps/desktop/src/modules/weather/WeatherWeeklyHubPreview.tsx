import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useWeatherWeekly } from '../../hooks/useWeatherWeekly.js';
import { WeatherIcon } from './WeatherIcon.js';

export function WeatherWeeklyHubPreview() {
  const life = useLifeState();
  const weekly = useWeatherWeekly({ apiOnline: life.apiOnline });
  const previewDays = weekly.payload?.days.slice(0, 5) ?? [];

  return (
    <div className="weather-hub-strip-wrap">
      <div className="weather-hub-strip__header">
        <span className="card-kicker">週間</span>
        <a href={screenHref('M-WEA-WK')} className="text-link">
          詳細 →
        </a>
      </div>
      {weekly.loading ? (
        <p className="hint-line">週間予報を読み込み中…</p>
      ) : previewDays.length > 0 ? (
        <div className="weather-hub-strip">
          {previewDays.map((day) => (
            <div key={day.dateKey} className="weather-hub-strip__day">
              <span className="weather-hub-strip__label">{day.weekdayLabel}</span>
              <WeatherIcon illustrationId={day.illustrationId} size="sm" />
              <span className="weather-hub-strip__temp">
                {day.tempMaxC}°/{day.tempMinC}°
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint-line">週間予報未取得</p>
      )}
    </div>
  );
}
