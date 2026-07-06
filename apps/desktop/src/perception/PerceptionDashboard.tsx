import { hasWeatherData, resolveDayPhase, statusLineForPhase } from '@urms/domain/perception';
import type { PerceptionState } from '@urms/shared';

import { useClock } from '../hooks/useClock.js';
import { useLifeState, type LifeStateView } from '../hooks/useLifeState.js';
import { layoutForPhase } from './phaseLayout.js';
import {
  DAY_PHASES,
  DAY_PHASE_LABELS,
  parsePreviewPhase,
  previewPhaseHref,
  resolveDisplayPhase,
} from './previewPhase.js';

type Props = {
  state?: PerceptionState;
};

function toneClass(tone: 'calm' | 'warm' | 'focus'): string {
  if (tone === 'warm') return 'event-dot event-dot--warm';
  if (tone === 'focus') return 'event-dot event-dot--focus';
  return 'event-dot event-dot--calm';
}

function continuityLabel(continuity: NonNullable<LifeStateView['sources']>['loopContinuity']): string | null {
  if (continuity === 'looped-today') return '今日ループ済';
  if (continuity === 'new-day') return '新しい一日';
  return null;
}

function relationTypesLine(types: Record<string, number> | undefined): string | null {
  if (!types) return null;
  const segments = Object.entries(types)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'en'))
    .slice(0, 2)
    .map(([type, count]) => `${type} ${count}`);
  return segments.length > 0 ? segments.join(' · ') : null;
}

function sourceLine(
  source: LifeStateView['source'],
  sources: LifeStateView['sources'],
): string | null {
  if (!sources) return null;
  const weather = sources.weather === 'live' ? '天気 live' : '天気 —';
  const schedule = `予定 ${sources.scheduleEvents} 件`;
  const relations =
    sources.relations > 0
      ? relationTypesLine(sources.relationTypes) ?? `関係 ${sources.relations}`
      : null;
  const loop = continuityLabel(sources.loopContinuity);
  const base =
    source === 'api'
      ? `${schedule} · ${weather} · Context API`
      : `${schedule} · ${weather} · Context ローカル`;
  const parts = [base, relations, loop].filter(Boolean);
  return parts.join(' · ');
}

function connectionLabel(apiOnline: boolean, dbReady: boolean, source: string, loading: boolean): string {
  if (loading) return '接続確認中…';
  if (source === 'api') return dbReady ? 'API 接続 · SSOT から合成' : 'API 接続 · DB 未起動';
  if (apiOnline) return 'API 応答なし — Context ローカル';
  return 'オフライン — Context ローカル';
}

export function PerceptionDashboard({ state: stateOverride }: Props) {
  const clock = useClock();
  const life = useLifeState();
  const state = stateOverride ?? life.state;
  const actualPhase = resolveDayPhase();
  const previewPhase = parsePreviewPhase();
  const phase = resolveDisplayPhase(actualPhase);
  const layout = layoutForPhase(phase);
  const statusLine = previewPhase ? statusLineForPhase(phase) : state.statusLine;
  const events = state.nextEvents.slice(0, layout.maxEvents);
  const syncTime = new Date().toLocaleTimeString('ja-JP', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={`dashboard dashboard--${phase}`}>
      <div className="dashboard__backdrop" aria-hidden="true" />

      <header className="dashboard__header">
        <span className="dashboard__brand">URMS</span>
        <span className="dashboard__header-meta">
          {previewPhase ? `プレビュー · ${DAY_PHASE_LABELS[phase]}` : null}
          {!previewPhase && stateOverride ? '固定表示' : null}
          {!previewPhase && !stateOverride
            ? connectionLabel(life.apiOnline, life.dbReady, life.source, life.loading)
            : null}
        </span>
      </header>

      <main className={`dashboard__grid dashboard__grid--${layout.gridMode}`}>
        <section className="panel panel--primary" aria-label="今">
          <p className="clock">{clock.time}</p>
          <p className="date-line">
            {clock.dateLabel} {clock.weekday}
          </p>
          <p className="status-line">{statusLine}</p>

          {layout.showWeather ? (
            <div className="glass-card">
              <p className="card-kicker">天気</p>
              {hasWeatherData(state.weather) ? (
                <>
                  <p className="metric-large">{state.weather.tempC}°C</p>
                  <p className="metric-detail">
                    降水 {state.weather.precipitationPct}% · 湿度 {state.weather.humidityPct}% · 風{' '}
                    {state.weather.windKmh}km/h
                  </p>
                  <p className="hint-line">{state.weather.hint}</p>
                </>
              ) : (
                <p className="hint-line">{state.weather.hint}</p>
              )}
            </div>
          ) : null}

          {events.length > 0 ? (
            <div className="glass-card">
              <p className="card-kicker">次の予定</p>
              <ul className="event-list">
                {events.map((event) => (
                  <li key={`${event.time}-${event.title}`} className="event-item">
                    <span className={toneClass(event.tone)} aria-hidden="true" />
                    <div>
                      <p className="event-time">{event.time}</p>
                      <p className="event-title">{event.title}</p>
                      {event.note ? <p className="event-note">{event.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {layout.gridMode !== 'minimal' ? (
          <section className="panel panel--center" aria-label="今日">
            {layout.showSummaryHero ? (
              <div className="glass-card glass-card--hero">
                <p className="card-kicker">今日のまとめ</p>
                <div className="summary-row">
                  <div className="condition-ring" aria-label={`コンディション ${state.summary.conditionScore}`}>
                    <span className="condition-score">{state.summary.conditionScore}</span>
                    <span className="condition-label">Condition</span>
                  </div>
                  {layout.showSummaryStats ? (
                    <div className="summary-stats">
                      <p>予定 {state.summary.events}</p>
                      <p>タスク {state.summary.tasks}</p>
                      <p>集中 {state.summary.focusHours}h 想定</p>
                      <p>移動 {state.summary.travelMinutes}m</p>
                    </div>
                  ) : null}
                </div>
                <p className="summary-note">{state.summary.note}</p>
              </div>
            ) : null}

            {layout.showWeight ? (
              <div className="glass-card">
                <p className="card-kicker">今日の重み · フォーカス</p>
                <p className="weight-line">
                  {state.summary.weight} · {state.summary.focus}
                </p>
              </div>
            ) : null}

            {layout.showTasks ? (
              <div className="glass-card">
                <p className="card-kicker">タスク</p>
                {state.tasks.length > 0 ? (
                  <ul className="task-list">
                    {state.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="hint-line">Context の current_task / next_task 未設定</p>
                )}
                {!previewPhase && !stateOverride && life.source === 'api' && life.dbReady && life.canAdvanceTask ? (
                  <div className="task-action">
                    <button
                      type="button"
                      className="task-action__button"
                      disabled={life.advancing}
                      onClick={() => void life.advanceTask()}
                    >
                      {life.advancing ? '更新中…' : '完了 → 次へ'}
                    </button>
                    {life.advanceError ? <p className="hint-line task-action__error">{life.advanceError}</p> : null}
                    {life.advanceSuccess ? (
                      <p className="hint-line task-action__success">{life.advanceSuccess}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="panel panel--side" aria-label="展望">
          {layout.showAiMemo ? (
            <div className="glass-card">
              <p className="card-kicker">AI からのひとこと</p>
              <p className="ai-memo">{state.aiMemo}</p>
            </div>
          ) : null}

          {layout.showConnection ? (
            <div className="glass-card glass-card--compact">
              <p className="card-kicker">接続</p>
              <p className="online-line">
                <span className={`online-dot${life.apiOnline ? '' : ' online-dot--off'}`} aria-hidden="true" />
                {connectionLabel(life.apiOnline, life.dbReady, life.source, life.loading)}
              </p>
              {sourceLine(life.source, life.sources) ? (
                <p className="hint-line">{sourceLine(life.source, life.sources)}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>

      <footer className="dashboard__footer">
        <span>同期: {syncTime}</span>
        <span className="tagline">整える。つなげる。よりよく生きるために。</span>
        <span className="online-line">
          <span className={`online-dot${life.apiOnline ? '' : ' online-dot--off'}`} aria-hidden="true" />
          {life.apiOnline ? 'オンライン' : 'オフライン'}
        </span>
      </footer>

      {import.meta.env.DEV ? (
        <nav className="phase-preview" aria-label="時間帯プレビュー（開発用）">
          <span className="phase-preview__label">時間帯</span>
          {DAY_PHASES.map((item) => (
            <a
              key={item}
              href={previewPhaseHref(item)}
              className={`phase-preview__link${phase === item ? ' phase-preview__link--active' : ''}`}
            >
              {DAY_PHASE_LABELS[item]}
            </a>
          ))}
          <a href="?" className="phase-preview__link">
            現在
          </a>
        </nav>
      ) : null}
    </div>
  );
}
