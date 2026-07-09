import { buildMonthDateKeys, weekdayIndexForDateKey } from '../../lib/calendar-month-grid.js';
import type { CalendarMonthEvent } from '@urms/shared';

import { useEffect, useMemo, useState } from 'react';

import type { GoogleCalendarStatusPayload } from '@urms/shared';

import { fetchGoogleCalendarStatus } from '../../api/client.js';
import { useCalendarMonth } from '../../hooks/useCalendarMonth.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useMode } from '../../features/mode/mode-context.js';
import { calendarDetailHref } from '../../app/appRoute.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function monthTitle(year: number, month: number): string {
  return `${year}年 ${month}月`;
}

function categoryLabel(category: CalendarMonthEvent['category']): string {
  if (category === 'reservation') return '予約';
  if (category === 'outgoing') return '外出';
  return '視聴';
}

function categoryClass(category: CalendarMonthEvent['category']): string {
  return `calendar-event__category calendar-event__category--${category}`;
}

function eventToneClass(category: CalendarMonthEvent['category']): string {
  return `calendar-grid__chip calendar-grid__chip--${category}`;
}

export function CalendarMonthlyPage() {
  const life = useLifeState();
  const { mode } = useMode();
  const calendar = useCalendarMonth({ apiOnline: life.apiOnline });
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatusPayload | null>(null);
  const timeZone = calendar.payload?.timezone ?? 'Asia/Tokyo';
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const allDateKeys = useMemo(
    () => buildMonthDateKeys(calendar.year, calendar.month),
    [calendar.year, calendar.month],
  );
  const leadingBlanks =
    allDateKeys.length > 0 ? weekdayIndexForDateKey(allDateKeys[0] ?? '', timeZone) : 0;
  const selectedEvents =
    calendar.selectedDateKey && calendar.payload
      ? (calendar.payload.days[calendar.selectedDateKey] ?? [])
      : [];

  useEffect(() => {
    if (!life.apiOnline) {
      setGoogleStatus(null);
      return;
    }

    let cancelled = false;
    void fetchGoogleCalendarStatus(mode).then((status) => {
      if (!cancelled) {
        setGoogleStatus(status);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [life.apiOnline, mode]);

  const googleConnected = googleStatus?.connected ?? calendar.payload?.googleConnected ?? false;
  const googleNote = googleStatus?.statusNote ?? null;

  return (
    <ModuleScreenLayout screenId="M-CAL-MON" title="マンスリー" moduleLabel="カレンダー">
      <div className="calendar-page-layout">
        <div className="calendar-page-layout__main">
          <section className="glass-card calendar-google-banner glass-card--accent">
            <p className="card-kicker">Google カレンダー</p>
            <p className="hint-line">
              {googleConnected
                ? '連携済み — 予定をマージ表示'
                : googleNote
                  ? `未連携 — ${googleNote}`
                  : '未連携 — ローカル schedule のみ'}
            </p>
          </section>

          <section className="glass-card calendar-toolbar">
            <button type="button" className="calendar-toolbar__nav" onClick={calendar.goPrevMonth}>
              ←
            </button>
            <h2 className="calendar-toolbar__title">{monthTitle(calendar.year, calendar.month)}</h2>
            <button type="button" className="calendar-toolbar__nav" onClick={calendar.goNextMonth}>
              →
            </button>
          </section>

          {calendar.loading ? (
            <section className="glass-card">
              <p className="hint-line">カレンダーを読み込み中…</p>
            </section>
          ) : null}

          {calendar.error ? (
            <section className="glass-card">
              <p className="hint-line">
                {!life.apiOnline
                  ? 'API 未起動 — start-dev-servers.bat'
                  : !life.dbReady
                    ? 'DB 未接続 — PostgreSQL を起動してください'
                    : 'カレンダーを取得できません'}
              </p>
            </section>
          ) : null}

          {calendar.payload ? (
            <section className="glass-card calendar-grid-wrap">
              <div className="calendar-grid__weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="calendar-grid__weekday">
                    {label}
                  </span>
                ))}
              </div>
              <div className="calendar-grid">
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <span key={`blank-${index}`} className="calendar-grid__cell calendar-grid__cell--blank" />
                ))}
                {allDateKeys.map((dateKey) => {
                  const dayNumber = Number.parseInt(dateKey.split('-')[2] ?? '0', 10);
                  const events = calendar.payload?.days[dateKey] ?? [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === calendar.selectedDateKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={[
                        'calendar-grid__cell',
                        isToday ? 'calendar-grid__cell--today' : '',
                        isSelected ? 'calendar-grid__cell--selected' : '',
                        events.length > 0 ? 'calendar-grid__cell--has-events' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => calendar.selectDate(dateKey)}
                    >
                      <span className="calendar-grid__day">{dayNumber}</span>
                      {events.length > 0 ? (
                        <span className="calendar-grid__chips">
                          {events.slice(0, 2).map((event) => (
                            <span
                              key={event.resourceId}
                              className={eventToneClass(event.category)}
                              title={event.title}
                            />
                          ))}
                          {events.length > 2 ? (
                            <span className="calendar-grid__more">+{events.length - 2}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="calendar-page-layout__aside">
          <section className="glass-card calendar-day-detail glass-card--accent">
            <p className="card-kicker">
              {calendar.selectedDateKey ? `${calendar.selectedDateKey}` : '日付を選択'}
            </p>
            {!calendar.selectedDateKey ? (
              <p className="hint-line">カレンダーから日付をタップ</p>
            ) : selectedEvents.length === 0 ? (
              <p className="hint-line">予定はありません</p>
            ) : (
              <>
                <a href={calendarDetailHref(calendar.selectedDateKey)} className="text-link">
                  詳細画面で見る →
                </a>
                <ul className="calendar-event-list">
                  {selectedEvents.map((event) => (
                    <li key={event.resourceId} className="calendar-event">
                      <div className="calendar-event__header">
                        <span className="calendar-event__time">{event.time}</span>
                        <span className={categoryClass(event.category)}>{categoryLabel(event.category)}</span>
                      </div>
                      <p className="calendar-event__title">{event.title}</p>
                      {event.note ? <p className="calendar-event__note">{event.note}</p> : null}
                      {event.leadAdvice ? (
                        <div className="calendar-event__lead">
                          <p className="calendar-event__lead-headline">{event.leadAdvice.headline}</p>
                          <p className="hint-line">{event.leadAdvice.detail}</p>
                        </div>
                      ) : null}
                      <a
                        href={calendarDetailHref(calendar.selectedDateKey ?? '', event.resourceId)}
                        className="text-link"
                      >
                        この予定の詳細
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </aside>
      </div>
    </ModuleScreenLayout>
  );
}
