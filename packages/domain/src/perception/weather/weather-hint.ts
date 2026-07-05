import type { PerceptionState } from '@urms/shared';

type WeatherMetrics = Pick<
  PerceptionState['weather'],
  'tempC' | 'precipitationPct' | 'humidityPct' | 'windKmh'
>;

/** 知覚層向け — 短い日本語ヒント（色ではなく重みで伝える） */
export function buildWeatherHint(metrics: WeatherMetrics): string {
  if (metrics.precipitationPct >= 60) {
    return '降水の可能性が高めです。傘があると安心です';
  }
  if (metrics.precipitationPct >= 35) {
    return '折りたたみ傘があると安心です';
  }
  if (metrics.windKmh >= 30) {
    return '風が強めです。外出時は注意を';
  }
  if (metrics.tempC >= 30) {
    return '暑めです。水分補給を意識して';
  }
  if (metrics.tempC <= 5) {
    return '冷え込みます。上着があるとよいです';
  }
  if (metrics.humidityPct >= 85) {
    return '湿度が高めです。体感温度に余裕を';
  }
  return '穏やかな天気です';
}
