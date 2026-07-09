/** Open-Meteo WMO code + 昼夜から UI 用イラスト ID を決定（Domain 正本） */
export type WeatherIllustrationId =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export function resolveWeatherIllustration(
  weatherCode: number | undefined,
  isDay: boolean | undefined,
  precipitationPct: number,
): WeatherIllustrationId {
  if (weatherCode === undefined || !Number.isFinite(weatherCode)) {
    if (precipitationPct >= 60) return 'rain';
    if (precipitationPct >= 30) return 'partly-cloudy';
    return isDay === false ? 'clear-night' : 'clear-day';
  }

  const code = Math.trunc(weatherCode);

  if (code === 0) {
    return isDay === false ? 'clear-night' : 'clear-day';
  }

  if (code === 1 || code === 2) {
    return isDay === false ? 'partly-cloudy' : 'partly-cloudy';
  }

  if (code === 3) {
    return 'overcast';
  }

  if (code === 45 || code === 48) {
    return 'fog';
  }

  if (code >= 51 && code <= 67) {
    return 'rain';
  }

  if (code >= 71 && code <= 77) {
    return 'snow';
  }

  if (code >= 80 && code <= 82) {
    return 'rain';
  }

  if (code >= 85 && code <= 86) {
    return 'snow';
  }

  if (code >= 95) {
    return 'thunderstorm';
  }

  return isDay === false ? 'clear-night' : 'clear-day';
}

export function weatherIllustrationLabel(id: WeatherIllustrationId): string {
  switch (id) {
    case 'clear-day':
      return '快晴';
    case 'clear-night':
      return '晴れ（夜）';
    case 'partly-cloudy':
      return 'くもり時々晴れ';
    case 'overcast':
      return '曇り';
    case 'fog':
      return '霧';
    case 'rain':
      return '雨';
    case 'snow':
      return '雪';
    case 'thunderstorm':
      return '雷雨';
    default:
      return '天気';
  }
}
