import type { LifeState } from './types.js';

/** v0 mock — API / Context Engine 連携前 */
export const mockLifeState: LifeState = {
  phase: 'morning',
  statusLine: '静かな朝です。余裕を持って過ごせそうです。',
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
    weight: '低〜中',
    focus: '安定',
    note: '重い負荷は予想されません。穏やかな一日になりそうです。',
  },
  tasks: ['提案書のブラッシュアップ', 'クライアント連絡', '請求書確認'],
  aiMemo: '急ぎなし、ゆるい開始。午前中は集中しやすい時間帯です。',
};
