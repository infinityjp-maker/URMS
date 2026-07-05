import type { DayPhase } from '@urms/shared';

export const DAY_PHASES: readonly DayPhase[] = ['morning', 'day', 'evening', 'night'];

export const DAY_PHASE_LABELS: Record<DayPhase, string> = {
  morning: '朝',
  day: '昼',
  evening: '夕',
  night: '夜',
};

export function parsePreviewPhase(search = window.location.search): DayPhase | null {
  if (!import.meta.env.DEV) return null;

  const raw = new URLSearchParams(search).get('phase');
  if (!raw) return null;
  return DAY_PHASES.includes(raw as DayPhase) ? (raw as DayPhase) : null;
}

export function resolveDisplayPhase(actualPhase: DayPhase, search = window.location.search): DayPhase {
  return parsePreviewPhase(search) ?? actualPhase;
}

export function previewPhaseHref(phase: DayPhase): string {
  return `?phase=${phase}`;
}
