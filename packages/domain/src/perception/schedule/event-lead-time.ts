import type { EventLeadTimeAdvice, PerceptionEventTone, ScheduleEventCategory } from '@urms/shared';

const MS_PER_DAY = 86_400_000;

/** v0.2 — 予定タイトル/メモから種別を推定（Domain 正本） */
export function resolveScheduleEventCategory(
  title: string,
  note?: string,
  tone?: PerceptionEventTone,
): ScheduleEventCategory {
  const text = `${title} ${note ?? ''}`;

  if (/予約|レストラン|美容院|クリニック|ホテル|店/.test(text)) {
    return 'reservation';
  }

  if (/通勤|外出|会議|打合|移動|定例|出張|ランチ|ミーティング|standup/i.test(text)) {
    return 'outgoing';
  }

  if (/TV|テレビ|視聴|配信/.test(text)) {
    return 'tv';
  }

  if (tone === 'focus') {
    return 'outgoing';
  }

  if (tone === 'warm') {
    return 'reservation';
  }

  return 'tv';
}

/** v0.2 — 種別に応じた「もうすぐ XX」リードタイム（Google 連携前のローカル予定向け） */
export function adviseEventLeadTime(
  category: ScheduleEventCategory,
  eventStart: Date,
  now: Date,
): EventLeadTimeAdvice | undefined {
  const diffMs = eventStart.getTime() - now.getTime();
  if (diffMs <= 0) {
    return undefined;
  }

  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  const diffMinutes = Math.floor(diffMs / 60_000);

  switch (category) {
    case 'tv':
      if (diffMinutes <= 15) {
        return {
          headline: 'まもなく開始',
          detail: '視聴予定 · 直前通知で十分',
        };
      }
      return undefined;

    case 'reservation':
      if (diffDays >= 1 && diffDays <= 3) {
        return {
          headline: '予約確認のタイミング',
          detail: '店舗予約 · 前日〜数日前に確認と移動時間を見直し',
        };
      }
      if (diffDays === 0) {
        return {
          headline: '本日の予約',
          detail: '出発前に予約内容 · 経路を再確認',
        };
      }
      return undefined;

    case 'outgoing':
      if (diffMinutes <= 30) {
        return {
          headline: 'そろそろ出発',
          detail: '外出/通勤 · 交通画面で出発時刻を確認',
        };
      }
      if (diffMinutes <= 60) {
        return {
          headline: '1 時間以内',
          detail: '準備 · 傘/交通をチェック',
        };
      }
      return undefined;
  }
}
