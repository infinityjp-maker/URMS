import type { TransportConfig } from './transport-config.js';
import { buildStationDeparturesForDay } from './departure-advice.js';
import { fetchOdptStationDepartures } from './odpt-station-timetable.js';

export type TimetableSource = 'odpt' | 'interval';

export type StationDepartureProviderOptions = {
  config: TransportConfig;
  targetDate: Date;
  fetchImpl?: typeof fetch;
};

export async function resolveStationDepartures(
  options: StationDepartureProviderOptions,
): Promise<{ departures: Date[]; source: TimetableSource }> {
  const { config, targetDate, fetchImpl } = options;

  if (config.odptConsumerKey && config.odptStationId) {
    const odptDepartures = await fetchOdptStationDepartures({
      consumerKey: config.odptConsumerKey,
      stationId: config.odptStationId,
      operatorId: config.odptOperatorId,
      targetDate,
      timeZone: config.timezone,
      fetchImpl,
    });

    if (odptDepartures && odptDepartures.length > 0) {
      return { departures: odptDepartures, source: 'odpt' };
    }
  }

  return {
    departures: buildStationDeparturesForDay(
      targetDate,
      config.timezone,
      config.departureIntervalMinutes,
    ),
    source: 'interval',
  };
}
