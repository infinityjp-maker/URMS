import type { WeatherIllustrationId } from './perception.js';

export type WeatherWeeklyDay = {
  readonly dateKey: string;
  readonly weekdayLabel: string;
  readonly tempMaxC: number;
  readonly tempMinC: number;
  readonly precipitationPct: number;
  readonly precipitationMm: number;
  readonly illustrationId: WeatherIllustrationId;
  readonly summary: string;
};

export type WeatherWeeklyPayload = {
  readonly timezone: string;
  readonly source: 'live' | 'empty';
  readonly days: readonly WeatherWeeklyDay[];
};

export type WeatherWeeklyResponse = {
  readonly data: WeatherWeeklyPayload;
};

export type WeatherHourlySlot = {
  readonly time: string;
  readonly precipitationPct: number;
  readonly tempC: number;
};

export type WeatherHourlyPayload = {
  readonly timezone: string;
  readonly source: 'live' | 'empty';
  readonly slots: readonly WeatherHourlySlot[];
};

export type WeatherHourlyResponse = {
  readonly data: WeatherHourlyPayload;
};
