import type { DayPhase } from '@urms/shared';

export type PhaseLayout = {
  maxEvents: number;
  showWeather: boolean;
  showCalendarMini: boolean;
  showTransportMini: boolean;
  showModuleLauncher: boolean;
  showSummaryHero: boolean;
  showSummaryStats: boolean;
  showWeight: boolean;
  showTasks: boolean;
  showAiMemo: boolean;
  showConnection: boolean;
  gridMode: 'full' | 'compact' | 'minimal';
};

/** User Vision — 時間帯で情報量と優先順位を変える */
export function layoutForPhase(phase: DayPhase): PhaseLayout {
  switch (phase) {
    case 'morning':
      return {
        maxEvents: 2,
        showWeather: true,
        showCalendarMini: true,
        showTransportMini: true,
        showModuleLauncher: true,
        showSummaryHero: false,
        showSummaryStats: false,
        showWeight: false,
        showTasks: false,
        showAiMemo: true,
        showConnection: false,
        gridMode: 'compact',
      };
    case 'day':
      return {
        maxEvents: 3,
        showWeather: true,
        showCalendarMini: true,
        showTransportMini: true,
        showModuleLauncher: true,
        showSummaryHero: true,
        showSummaryStats: true,
        showWeight: true,
        showTasks: true,
        showAiMemo: true,
        showConnection: true,
        gridMode: 'full',
      };
    case 'evening':
      return {
        maxEvents: 2,
        showWeather: true,
        showCalendarMini: true,
        showTransportMini: false,
        showModuleLauncher: true,
        showSummaryHero: true,
        showSummaryStats: false,
        showWeight: true,
        showTasks: true,
        showAiMemo: true,
        showConnection: true,
        gridMode: 'compact',
      };
    case 'night':
      return {
        maxEvents: 0,
        showWeather: false,
        showCalendarMini: true,
        showTransportMini: false,
        showModuleLauncher: true,
        showSummaryHero: false,
        showSummaryStats: false,
        showWeight: false,
        showTasks: false,
        showAiMemo: true,
        showConnection: false,
        gridMode: 'minimal',
      };
  }
}
