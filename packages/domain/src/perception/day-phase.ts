import type { DayPhase } from '@urms/shared';

export function resolveDayPhase(date = new Date()): DayPhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function statusLineForPhase(phase: DayPhase): string {
  switch (phase) {
    case 'morning':
      return '静かな朝です。余裕を持って過ごせそうです。';
    case 'day':
      return '判断と実行の時間帯です。';
    case 'evening':
      return '一日を整える時間です。';
    case 'night':
      return '情報を少なく、ゆっくり。';
  }
}
