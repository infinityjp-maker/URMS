import type { PerceptionState } from '@urms/shared';

/** 外部連携前の固定フィクスチャ（天気 · 予定など） */
export const PERCEPTION_FIXTURES: Omit<PerceptionState, 'phase' | 'statusLine' | 'tasks' | 'aiMemo' | 'summary'> & {
  summary: Omit<PerceptionState['summary'], 'note' | 'weight' | 'focus'>;
} = {
  weather: {
    tempC: 22,
    precipitationPct: 30,
    humidityPct: 78,
    windKmh: 12,
    hint: '傘を持っていくと安心です',
  },
  nextEvents: [
    { time: '09:30', title: 'プロジェクト定例', note: 'あと 1h 48m', tone: 'calm' },
    { time: '13:00', title: '田中さんとランチ', tone: 'warm' },
    { time: '16:30', title: '資料レビュー', note: '集中時間推奨', tone: 'focus' },
  ],
  summary: {
    conditionScore: 72,
    events: 2,
    tasks: 3,
    focusHours: 5.2,
    travelMinutes: 70,
  },
};

export const DEFAULT_TASKS = ['提案書のブラッシュアップ', 'クライアント連絡', '請求書確認'];
