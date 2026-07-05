import { useClock } from '../hooks/useClock.js';
import { mockLifeState } from './mockLifeState.js';
import type { LifeState } from './types.js';

type Props = {
  state?: LifeState;
};

function toneClass(tone: 'calm' | 'warm' | 'focus'): string {
  if (tone === 'warm') return 'event-dot event-dot--warm';
  if (tone === 'focus') return 'event-dot event-dot--focus';
  return 'event-dot event-dot--calm';
}

export function PerceptionDashboard({ state = mockLifeState }: Props) {
  const clock = useClock();
  const syncTime = new Date().toLocaleTimeString('ja-JP', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={`dashboard dashboard--${state.phase}`}>
      <div className="dashboard__backdrop" aria-hidden="true" />

      <header className="dashboard__header">
        <span className="dashboard__brand">URMS</span>
        <span className="dashboard__header-meta">v0 · 知覚層</span>
      </header>

      <main className="dashboard__grid">
        <section className="panel panel--primary" aria-label="今">
          <p className="clock">{clock.time}</p>
          <p className="date-line">
            {clock.dateLabel} {clock.weekday}
          </p>
          <p className="status-line">{state.statusLine}</p>

          <div className="glass-card">
            <p className="card-kicker">天気</p>
            <p className="metric-large">{state.weather.tempC}°C</p>
            <p className="metric-detail">
              降水 {state.weather.precipitationPct}% · 湿度 {state.weather.humidityPct}% · 風{' '}
              {state.weather.windKmh}km/h
            </p>
            <p className="hint-line">{state.weather.hint}</p>
          </div>

          <div className="glass-card">
            <p className="card-kicker">次の予定</p>
            <ul className="event-list">
              {state.nextEvents.map((event) => (
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
        </section>

        <section className="panel panel--center" aria-label="今日">
          <div className="glass-card glass-card--hero">
            <p className="card-kicker">今日のまとめ</p>
            <div className="summary-row">
              <div className="condition-ring" aria-label={`コンディション ${state.summary.conditionScore}`}>
                <span className="condition-score">{state.summary.conditionScore}</span>
                <span className="condition-label">Condition</span>
              </div>
              <div className="summary-stats">
                <p>予定 {state.summary.events}</p>
                <p>タスク {state.summary.tasks}</p>
                <p>集中 {state.summary.focusHours}h 想定</p>
                <p>移動 {state.summary.travelMinutes}m</p>
              </div>
            </div>
            <p className="summary-note">{state.summary.note}</p>
          </div>

          <div className="glass-card">
            <p className="card-kicker">今日の重み · フォーカス</p>
            <p className="weight-line">
              {state.summary.weight} · {state.summary.focus}
            </p>
          </div>

          <div className="glass-card">
            <p className="card-kicker">タスク</p>
            <ul className="task-list">
              {state.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel panel--side" aria-label="展望">
          <div className="glass-card">
            <p className="card-kicker">AI からのひとこと</p>
            <p className="ai-memo">{state.aiMemo}</p>
          </div>

          <div className="glass-card glass-card--compact">
            <p className="card-kicker">接続</p>
            <p className="online-line">
              <span className="online-dot" aria-hidden="true" />
              ローカル · API 未接続（v0）
            </p>
          </div>
        </section>
      </main>

      <footer className="dashboard__footer">
        <span>同期: {syncTime}</span>
        <span className="tagline">整える。つなげる。よりよく生きるために。</span>
        <span className="online-line">
          <span className="online-dot" aria-hidden="true" />
          オンライン
        </span>
      </footer>
    </div>
  );
}
