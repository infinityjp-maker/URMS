import type { PerceptionMeta } from '@urms/shared';

import type { LifeStateSource } from '../hooks/useLifeState.js';

function relationTypesLine(types: Record<string, number> | undefined): string | null {
  if (!types) return null;
  const segments = Object.entries(types)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'en'))
    .slice(0, 2)
    .map(([type, count]) => `${type} ${count}`);
  return segments.length > 0 ? segments.join(' · ') : null;
}

function weatherCoordsLabel(coords: PerceptionMeta['sources']['weatherCoords']): string {
  if (coords === 'device') return '座標 GPS';
  if (coords === 'ssot') return '座標 SSOT';
  return '座標 —';
}

function loopContinuityLabel(continuity: PerceptionMeta['sources']['loopContinuity']): string {
  if (continuity === 'looped-today') return '今日ループ済';
  if (continuity === 'new-day') return '新しい一日';
  return 'ループ 未記録';
}

function locationLabel(location: string | null, source: LifeStateSource): string | null {
  if (location) return `地点 ${location}`;
  if (source === 'api') return '地点 —';
  return null;
}

function relationsLabel(
  relations: number,
  relationTypes: Record<string, number>,
  source: LifeStateSource,
): string | null {
  if (relations > 0) {
    return relationTypesLine(relationTypes) ?? `関係 ${relations}`;
  }
  if (source === 'api') return '関係 —';
  return null;
}

/** VT-3 — 接続カード用ソース行（未取得は「—」で正直表示） */
export function formatConnectionSourceLine(
  source: LifeStateSource,
  sources: PerceptionMeta['sources'] | null,
): string | null {
  if (!sources) return null;

  const weather = sources.weather === 'live' ? '天気 live' : '天気 —';
  const schedule = `予定 ${sources.scheduleEvents} 件`;
  const base =
    source === 'api'
      ? `${schedule} · ${weather} · Context API`
      : `${schedule} · ${weather} · Context ローカル`;

  const parts = [
    base,
    locationLabel(sources.location, source),
    source === 'api' ? weatherCoordsLabel(sources.weatherCoords) : null,
    relationsLabel(sources.relations, sources.relationTypes, source),
    source === 'api' ? loopContinuityLabel(sources.loopContinuity) : null,
    sources.loopNarrative,
  ].filter(Boolean);

  return parts.join(' · ');
}
