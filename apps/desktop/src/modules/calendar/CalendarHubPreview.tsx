import { useMemo } from 'react';

import { calendarDetailHref, screenHref } from '../../app/appRoute.js';
import { useCalendarMonth } from '../../hooks/useCalendarMonth.js';
import { useLifeState } from '../../hooks/useLifeState.js';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function weekdayIndex(dateKey: string, timeZone: string): number {
  const anchor =
    timeZone === 'Asia/Tokyo'
      ? new Date(`${dateKey}T12:00:00+09:00`)
      : new Date(`${dateKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(anchor);
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Math.max(0, labels.indexOf(weekday));
}

function calendarStatusLine(
  apiOnline: boolean,
  dbReady: boolean,
  lifeLoading: boolean,
  calendarLoading: boolean,
  calendarError: boolean,
): string {
  if (lifeLoading || calendarLoading) {
    return '月次を読み込み中…';
  }
  if (!apiOnline) {
    return 'API 未起動 — pnpm dev:api または start-dev-servers.bat';
  }
  if (!dbReady) {
    return 'DB 未接続 — 予定データは取得不可';
  }
  if (calendarError) {
    return '月次取得失敗 — 15 秒ごとに再試行中';
  }
  return 'マンスリー表示 · タップで詳細';
}

type Props = {
  readonly compact?: boolean;
};

export function CalendarHubPreview({ compact = false }: Props) {
  const life = useLifeState();
  const calendar = useCalendarMonth({ apiOnline: life.apiOnline });
  const timeZone = calendar.payload?.timezone ?? 'Asia/Tokyo';
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const dateKeys = calendar.payload ? Object.keys(calendar.payload.days).sort() : [];
  const leadingBlanks = dateKeys.length > 0 ? weekdayIndex(dateKeys[0] ?? '', timeZone) : 0;

  const monthEventCount = useMemo(() => {
    if (!calendar.payload) {
      return 0;
    }
    return Object.values(calendar.payload.days).reduce((sum, events) => sum + events.length, 0);
  }, [calendar.payload]);

  const todayEvents = calendar.payload?.days[todayKey] ?? [];
  const showGrid = calendar.payload && !calendar.error && life.apiOnline && life.dbReady;
  const hubHref =
    todayEvents.length > 0
      ? calendarDetailHref(todayKey, todayEvents[0]?.resourceId)
      : screenHref('M-CAL-MON');

  return (
    <a href={hubHref} className="glass-card glass-card--link calendar-hub">
      <p className="card-kicker">カレンダー · 月表示へ</p>

      {showGrid ? (
        <>
          <p className="calendar-hub__title">
            {calendar.year}年 {calendar.month}月
            <span className="calendar-hub__count"> · {monthEventCount} 件</span>
          </p>

          <div className={`calendar-hub__weekdays${compact ? ' calendar-hub__weekdays--compact' : ''}`}>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className={`calendar-hub__grid${compact ? ' calendar-hub__grid--compact' : ''}`}>
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} className="calendar-hub__cell calendar-hub__cell--blank" />
            ))}
            {dateKeys.map((dateKey) => {
              const dayNumber = Number.parseInt(dateKey.split('-')[2] ?? '0', 10);
              const events = calendar.payload?.days[dateKey] ?? [];
              const isToday = dateKey === todayKey;

              return (
                <span
                  key={dateKey}
                  className={[
                    'calendar-hub__cell',
                    isToday ? 'calendar-hub__cell--today' : '',
                    events.length > 0 ? 'calendar-hub__cell--has-events' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {dayNumber}
                </span>
              );
            })}
          </div>

          {todayEvents.length > 0 ? (
            <p className="hint-line calendar-hub__today">
              今日 {todayEvents.length} 件 — 直近 {todayEvents[0]?.time} {todayEvents[0]?.title}
            </p>
          ) : (
            <p className="hint-line">本日の予定なし · タップで月全体</p>
          )}
        </>
      ) : (
        <p className="hint-line">
          {calendarStatusLine(
            life.apiOnline,
            life.dbReady,
            life.loading,
            calendar.loading,
            calendar.error,
          )}
        </p>
      )}
    </a>
  );
}
