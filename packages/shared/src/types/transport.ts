export type DepartureAdvice = {
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

export type RouteAdvice = {
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

export type TimetableSource = 'odpt' | 'interval';

export type TransportDeparturePayload = {
  readonly timezone: string;
  readonly stationName: string;
  readonly advice: DepartureAdvice | null;
  readonly route: RouteAdvice | null;
  readonly timetableSource: TimetableSource;
  readonly note: string | null;
};

export type TransportDepartureResponse = {
  readonly data: TransportDeparturePayload;
};
