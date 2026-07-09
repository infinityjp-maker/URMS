import type { TransportConfig } from './transport-config.js';

export type DepartureAdviceInput = {
  eventTitle: string;
  eventStart: Date;
  now: Date;
  stationDepartures: readonly Date[];
  config: Pick<
    TransportConfig,
    'stationName' | 'walkToStationMinutes' | 'bufferMinutes' | 'rideMinutes' | 'spareCoffeeThresholdMinutes' | 'timezone'
  >;
};

export type DepartureAdviceResult = {
  readonly eventTitle: string;
  readonly eventTime: string;
  readonly stationName: string;
  readonly recommendedTrainDeparture: string;
  readonly leaveHomeBy: string;
  readonly leaveInMinutes: number;
  readonly spareMinutes: number | null;
  readonly spareSuggestion: string | null;
  readonly headline: string;
  readonly detail: string;
};

export function formatClockTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

/** 簡易駅発時刻表（S4 前半 · 外部 API 前の固定間隔） */
export function buildStationDeparturesForDay(
  targetDate: Date,
  timeZone: string,
  intervalMinutes: number,
  startHour = 5,
  endHour = 23,
): Date[] {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(targetDate);

  const departures: Date[] = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      const instant =
        timeZone === 'Asia/Tokyo'
          ? new Date(`${dateKey}T${hh}:${mm}:00+09:00`)
          : new Date(`${dateKey}T${hh}:${mm}:00Z`);
      departures.push(instant);
    }
  }

  return departures;
}

function minutesUntil(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

/** 外出予定から「何時に家を出るか」を算出（Domain 正本） */
export function adviseDeparture(input: DepartureAdviceInput): DepartureAdviceResult | undefined {
  const { eventTitle, eventStart, now, stationDepartures, config } = input;
  if (eventStart.getTime() <= now.getTime()) {
    return undefined;
  }

  const latestBoarding = new Date(eventStart.getTime() - config.rideMinutes * 60_000);
  const candidate = [...stationDepartures]
    .filter((departure) => departure.getTime() <= latestBoarding.getTime() && departure.getTime() > now.getTime())
    .sort((left, right) => right.getTime() - left.getTime())[0];

  if (!candidate) {
    return undefined;
  }

  const leaveHomeBy = new Date(
    candidate.getTime() - (config.walkToStationMinutes + config.bufferMinutes) * 60_000,
  );
  const leaveInMinutes = minutesUntil(now, leaveHomeBy);
  const spareMinutes = leaveInMinutes > 0 ? leaveInMinutes : 0;
  const spareSuggestion =
    spareMinutes >= config.spareCoffeeThresholdMinutes ? '余裕あり · 缶コーヒーなど短時間の余白可' : null;

  const eventTime = formatClockTime(eventStart, config.timezone);
  const recommendedTrainDeparture = formatClockTime(candidate, config.timezone);
  const leaveHomeByLabel = formatClockTime(leaveHomeBy, config.timezone);

  const headline =
    leaveInMinutes <= 0
      ? '今すぐ出発'
      : leaveInMinutes <= config.walkToStationMinutes
        ? `あと ${leaveInMinutes} 分で家を出る`
        : `${leaveHomeByLabel} までに家を出る`;

  const detail = `${config.stationName} ${recommendedTrainDeparture} 発 · 徒歩 ${config.walkToStationMinutes} 分 + 余裕 ${config.bufferMinutes} 分`;

  return {
    eventTitle,
    eventTime,
    stationName: config.stationName,
    recommendedTrainDeparture,
    leaveHomeBy: leaveHomeByLabel,
    leaveInMinutes,
    spareMinutes: spareMinutes > 0 ? spareMinutes : null,
    spareSuggestion,
    headline,
    detail,
  };
}
