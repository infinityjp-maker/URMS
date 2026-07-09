import { useMemo } from 'react';

import { readCalendarDetailDate, readCalendarEventId, screenHref } from '../../app/appRoute.js';
import { useCalendarMonth } from '../../hooks/useCalendarMonth.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

function categoryLabel(category: 'tv' | 'reservation' | 'outgoing'): string {
  if (category === 'reservation') return '予約';
  if (category === 'outgoing') return '外出';
  return '視聴';
}

function categoryClass(category: 'tv' | 'reservation' | 'outgoing'): string {
  return `calendar-event__category calendar-event__category--${category}`;
}

export function CalendarEventDetailPage() {
  const life = useLifeState();
  const dateKey = readCalendarDetailDate();
  const eventId = readCalendarEventId();
  const calendar = useCalendarMonth({ apiOnline: life.apiOnline });

  const events = useMemo(() => {
    if (!dateKey || !calendar.payload) {
      return [];
    }
    return calendar.payload.days[dateKey] ?? [];
  }, [calendar.payload, dateKey]);

  const focusedEvent = eventId ? events.find((event) => event.resourceId === eventId) : undefined;

  return (
    <ModuleScreenLayout screenId="M-CAL-DET" title="予定詳細" moduleLabel="カレンダー">
      <section className="glass-card">
        <p className="card-kicker">{dateKey ? `${dateKey} の予定` : '日付未指定'}</p>
        {!dateKey ? (
          <p className="hint-line">カレンダーから日付を選んでください。</p>
        ) : calendar.loading ? (
          <p className="hint-line">予定を読み込み中…</p>
        ) : events.length === 0 ? (
          <p className="hint-line">この日の予定はありません。</p>
        ) : (
          <ul className="calendar-event-list">
            {events.map((event) => (
              <li
                key={event.resourceId}
                className={[
                  'calendar-event',
                  eventId === event.resourceId ? 'calendar-event--focused' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
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
                {event.category === 'outgoing' ? (
                  <a href={screenHref('M-TRN-DEP')} className="module-shortcuts__link">
                    交通 · 出発時刻を見る
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {eventId && !focusedEvent && events.length > 0 ? (
          <p className="hint-line">指定の予定が見つかりません — 同日の予定を表示しています。</p>
        ) : null}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-CAL-MON')} className="module-shortcuts__link">
          マンスリーに戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
