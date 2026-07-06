export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export type PerceptionEventTone = 'calm' | 'warm' | 'focus';

export interface PerceptionState {
  phase: DayPhase;
  statusLine: string;
  weather: {
    tempC: number;
    precipitationPct: number;
    humidityPct: number;
    windKmh: number;
    hint: string;
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

export type PerceptionMeta = {
  canAdvanceTask: boolean;
  sources: {
    context: 'api';
    scheduleEvents: number;
    weather: PerceptionWeatherSource;
  };
};

export type PerceptionResponse = {
  data: PerceptionState;
  meta: PerceptionMeta;
};
