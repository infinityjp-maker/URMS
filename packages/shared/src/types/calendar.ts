import type { PerceptionEventTone } from './perception.js';

export type ScheduleEventCategory = 'tv' | 'reservation' | 'outgoing';

export type EventLeadTimeAdvice = {
  readonly headline: string;
  readonly detail: string;
};

export type CalendarMonthEvent = {
  readonly time: string;
  readonly title: string;
  readonly note?: string;
  readonly tone: PerceptionEventTone;
  readonly resourceId: string;
  readonly category: ScheduleEventCategory;
  readonly leadAdvice?: EventLeadTimeAdvice;
};

export type CalendarMonthPayload = {
  readonly year: number;
  readonly month: number;
  readonly timezone: string;
  readonly googleConnected: boolean;
  readonly days: Readonly<Record<string, readonly CalendarMonthEvent[]>>;
};

export type CalendarMonthResponse = {
  readonly data: CalendarMonthPayload;
};
