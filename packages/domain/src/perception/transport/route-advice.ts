import type { TransportConfig } from './transport-config.js';
import { formatClockTime } from './departure-advice.js';
import type { DepartureAdviceResult } from './departure-advice.js';

export type RouteAdviceInput = {
  departure: Pick<
    DepartureAdviceResult,
    'eventTitle' | 'eventTime' | 'stationName' | 'recommendedTrainDeparture'
  >;
  eventStart: Date;
  config: Pick<TransportConfig, 'rideMinutes' | 'timezone' | 'stationName'>;
};

export type RouteAdviceResult = {
  readonly originStation: string;
  readonly destinationLabel: string;
  readonly trainDeparture: string;
  readonly estimatedArrival: string;
  readonly rideMinutes: number;
  readonly transferCount: number;
  readonly steps: readonly string[];
  readonly headline: string;
  readonly detail: string;
};

function parseDepartureInstant(
  departureLabel: string,
  eventStart: Date,
  timeZone: string,
): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(departureLabel.trim());
  if (!match) {
    return null;
  }

  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(eventStart);

  const hh = String(Number.parseInt(match[1] ?? '', 10)).padStart(2, '0');
  const mm = match[2] ?? '00';

  if (timeZone === 'Asia/Tokyo') {
    return new Date(`${dateKey}T${hh}:${mm}:00+09:00`);
  }

  return new Date(`${dateKey}T${hh}:${mm}:00Z`);
}

/** 簡易ルート · 到着予想（S4 前半 · 乗換 API 前） */
export function adviseRoute(input: RouteAdviceInput): RouteAdviceResult | undefined {
  const { departure, eventStart, config } = input;
  const trainInstant = parseDepartureInstant(
    departure.recommendedTrainDeparture,
    eventStart,
    config.timezone,
  );

  if (!trainInstant) {
    return undefined;
  }

  const arrivalInstant = new Date(trainInstant.getTime() + config.rideMinutes * 60_000);
  const estimatedArrival = formatClockTime(arrivalInstant, config.timezone);
  const transferCount = config.rideMinutes >= 35 ? 1 : 0;
  const destinationLabel = departure.eventTitle.trim() || '予定場所';

  const steps: string[] = [
    `${departure.stationName} ${departure.recommendedTrainDeparture} 発 — 各駅停車`,
  ];

  if (transferCount > 0) {
    const transferAt = formatClockTime(
      new Date(trainInstant.getTime() + Math.floor(config.rideMinutes * 0.45) * 60_000),
      config.timezone,
    );
    steps.push(`${transferAt} 乗換（簡易 1 回）`);
  }

  steps.push(`${estimatedArrival} 到着予想 — ${destinationLabel}`);

  const headline =
    transferCount > 0
      ? `${estimatedArrival} 到着 · 乗換 ${transferCount} 回`
      : `${estimatedArrival} 到着予想`;

  const detail = `${departure.stationName} → ${destinationLabel} · 乗車 ${config.rideMinutes} 分 · 予定 ${departure.eventTime} 開始`;

  return {
    originStation: departure.stationName,
    destinationLabel,
    trainDeparture: departure.recommendedTrainDeparture,
    estimatedArrival,
    rideMinutes: config.rideMinutes,
    transferCount,
    steps,
    headline,
    detail,
  };
}
