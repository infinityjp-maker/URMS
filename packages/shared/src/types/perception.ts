export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export type PerceptionEventTone = 'calm' | 'warm' | 'focus';

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

export interface PerceptionState {
  phase: DayPhase;
  statusLine: string;
  weather: {
    tempC: number;
    precipitationPct: number;
    humidityPct: number;
    windKmh: number;
    hint: string;
    /** Open-Meteo WMO weather_code */
    weatherCode?: number;
    isDay?: boolean;
    illustrationId: WeatherIllustrationId;
  };
  nextEvents: Array<{
    time: string;
    title: string;
    note?: string;
    tone: PerceptionEventTone;
  }>;
  summary: {
    conditionScore: number;
    events: number;
    tasks: number;
    focusHours: number;
    travelMinutes: number;
    weight: string;
    focus: string;
    note: string;
  };
  tasks: string[];
  aiMemo: string;
}

export type PerceptionWeatherSource = 'live' | 'empty';

export type WeatherCoordSource = 'device' | 'ssot';

export type LoopContinuity = 'none' | 'looped-today' | 'new-day';

export type PerceptionMeta = {
  canAdvanceTask: boolean;
  sources: {
    context: 'api';
    scheduleEvents: number;
    weather: PerceptionWeatherSource;
    /** 天気 API に渡した座標の出所（VT-3 正直表示） */
    weatherCoords: WeatherCoordSource | null;
    loopJournalEntries: number;
    loopContinuity: LoopContinuity;
    /** VT-4 — journal から合成した narrative（接続カード用） */
    loopNarrative: string | null;
    relations: number;
    relationTypes: Record<string, number>;
    placeName: string | null;
    location: string | null;
  };
};

export type PerceptionResponse = {
  data: PerceptionState;
  meta: PerceptionMeta;
};
