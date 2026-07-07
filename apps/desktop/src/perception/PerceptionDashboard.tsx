import { hasWeatherData, resolveDayPhase, statusLineForPhase } from '@urms/domain/perception';
import type { PerceptionState } from '@urms/shared';

import { useClock } from '../hooks/useClock.js';
import { useLifeState } from '../hooks/useLifeState.js';
import { DevelopPanel } from '../features/develop/DevelopPanel.js';
import { ModeSwitcher } from '../features/mode/ModeSwitcher.js';
import { getModeLabel } from '../features/mode/mode-ui.js';
import { useMode } from '../features/mode/mode-context.js';
import { formatConnectionSourceLine } from './connection-source-line.js';
import { layoutForPhase } from './phaseLayout.js';
import { formatWeatherCoordHint, formatWeatherLocationLabel } from './weather-coord-hint.js';
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

function connectionLabel(apiOnline: boolean, dbReady: boolean, source: string, loading: boolean): string {
  if (loading) return '接続確認中…';
  if (source === 'api') return dbReady ? 'API 接続 · SSOT から合成' : 'API 接続 · DB 未起動';
  if (apiOnline) return 'API 応答なし — Context ローカル';
  return 'API 未起動 — pnpm dev:api または start-dev-servers.bat';
}

export function PerceptionDashboard({ state: stateOverride }: Props) {
  const clock = useClock();
  const { mode } = useMode();
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
  const connectionSourceLine = formatConnectionSourceLine(life.source, life.sources);
  const weatherLocationLabel = formatWeatherLocationLabel(life.source, life.sources?.placeName);
  const weatherCoordHint = formatWeatherCoordHint(
    life.source,
    life.sources?.weatherCoords,
    hasWeatherData(state.weather),
  );

  return (
    <div className={`dashboard dashboard--${phase}`}>
      <div className="dashboard__backdrop" aria-hidden="true" />

      <header className="dashboard__header">
        <span className="dashboard__brand">URMS</span>
        <div className="dashboard__header-meta">
          {!previewPhase && !stateOverride ? (
            <>
              <span className="dashboard__mode-label">{getModeLabel(mode)}</span>
              <ModeSwitcher />
              <span>
                {connectionLabel(life.apiOnline, life.dbReady, life.source, life.loading)}
              </span>
            </>
          ) : null}
          {previewPhase ? `プレビュー · ${DAY_PHASE_LABELS[phase]}` : null}
          {!previewPhase && stateOverride ? '固定表示' : null}
        </div>
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
              {weatherLocationLabel ? (
                <p className="metric-detail weather-location-label">{weatherLocationLabel}</p>
              ) : null}
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
              {weatherCoordHint ? <p className="hint-line">{weatherCoordHint}</p> : null}
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
          ) : layout.maxEvents > 0 && !previewPhase && life.source === 'api' ? (
            <div className="glass-card">
              <p className="card-kicker">次の予定</p>
              <p className="hint-line">予定 — （schedule SSOT 未設定 · 本日分なし）</p>
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
              {connectionSourceLine ? (
                <p className="hint-line">{connectionSourceLine}</p>
              ) : null}
            </div>
          ) : null}

          <DevelopPanel />
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
