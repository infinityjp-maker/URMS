import type { CalendarMonthEvent } from '@urms/shared';

import { filterIcsEventsForMonth, parseIcsEvents } from './parse-ics.js';
import { mapGoogleEventsToMonthDays } from './map-google-events.js';
import { resolveGoogleCalendarConfig, type GoogleCalendarConfig } from './google-calendar-config.js';

export type GoogleCalendarMonthResult = {
  connected: boolean;
  statusNote: string | null;
  days: Record<string, CalendarMonthEvent[]>;
};

export type GoogleCalendarFetch = typeof fetch;

export interface GoogleCalendarService {
  getMonthEvents(year: number, month: number, now?: Date): Promise<GoogleCalendarMonthResult>;
  getStatus(): Promise<{ connected: boolean; statusNote: string | null }>;
}

export type GoogleCalendarServiceOptions = {
  config?: GoogleCalendarConfig;
  fetchImpl?: GoogleCalendarFetch;
};

export class IcsGoogleCalendarService implements GoogleCalendarService {
  private readonly config: GoogleCalendarConfig;
  private readonly fetchImpl: GoogleCalendarFetch;
  private cachedIcs: string | null = null;
  private cachedAt = 0;
  private static readonly CACHE_MS = 60_000;

  constructor(options: GoogleCalendarServiceOptions = {}) {
    this.config = options.config ?? resolveGoogleCalendarConfig();
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getStatus(): Promise<{ connected: boolean; statusNote: string | null }> {
    if (!this.config.enabled || !this.config.icsUrl) {
      return {
        connected: false,
        statusNote: 'URMS_GOOGLE_CALENDAR_ICS_URL 未設定',
      };
    }

    const content = await this.fetchIcs();
    if (!content) {
      return {
        connected: false,
        statusNote: 'ICS フィード取得失敗',
      };
    }

    return {
      connected: true,
      statusNote: null,
    };
  }

  async getMonthEvents(year: number, month: number, now = new Date()): Promise<GoogleCalendarMonthResult> {
    if (!this.config.enabled || !this.config.icsUrl) {
      return {
        connected: false,
        statusNote: 'Google カレンダー未設定',
        days: {},
      };
    }

    const content = await this.fetchIcs();
    if (!content) {
      return {
        connected: false,
        statusNote: 'ICS フィード取得失敗',
        days: {},
      };
    }

    const parsed = parseIcsEvents(content, this.config.timezone);
    const monthEvents = filterIcsEventsForMonth(parsed, year, month, this.config.timezone);
    const days = mapGoogleEventsToMonthDays(monthEvents, now, this.config.timezone);

    return {
      connected: true,
      statusNote: null,
      days,
    };
  }

  private async fetchIcs(): Promise<string | null> {
    const nowMs = Date.now();
    if (this.cachedIcs && nowMs - this.cachedAt < IcsGoogleCalendarService.CACHE_MS) {
      return this.cachedIcs;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const response = await this.fetchImpl(this.config.icsUrl!, {
        signal: controller.signal,
        headers: { Accept: 'text/calendar' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const text = await response.text();
      this.cachedIcs = text;
      this.cachedAt = nowMs;
      return text;
    } catch {
      return null;
    }
  }
}

export function createGoogleCalendarService(options: GoogleCalendarServiceOptions = {}): GoogleCalendarService {
  return new IcsGoogleCalendarService(options);
}
