export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export type LifeState = {
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
    tone: 'calm' | 'warm' | 'focus';
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
};
