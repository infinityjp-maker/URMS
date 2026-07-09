export type OdptStationTimetableObject = {
  readonly 'odpt:departureTime'?: string;
  readonly 'odpt:destinationStation'?: readonly string[];
};

export type OdptStationTimetable = {
  readonly 'odpt:stationTimetableObject'?: readonly OdptStationTimetableObject[];
};

export type OdptFetch = typeof fetch;

export function buildOdptStationTimetableUrl(options: {
  consumerKey: string;
  stationId: string;
  operatorId?: string;
}): string {
  const params = new URLSearchParams();
  params.set('acl:consumerKey', options.consumerKey);
  params.set('odpt:station', options.stationId);
  if (options.operatorId?.trim()) {
    params.set('odpt:operator', options.operatorId);
  }
  return `https://api.odpt.org/api/v4/odpt:StationTimetable?${params.toString()}`;
}

/** ODPT 駅時刻表から本日の発車時刻を抽出 */
export function mapOdptDepartures(
  payload: readonly OdptStationTimetable[],
  targetDate: Date,
  timeZone: string,
): Date[] {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(targetDate);

  const departures: Date[] = [];
  for (const timetable of payload) {
    for (const entry of timetable['odpt:stationTimetableObject'] ?? []) {
      const departureTime = entry['odpt:departureTime']?.trim();
      if (!departureTime || !/^\d{1,2}:\d{2}$/.test(departureTime)) {
        continue;
      }

      const [hourText, minuteText] = departureTime.split(':');
      const hh = String(Number.parseInt(hourText ?? '', 10)).padStart(2, '0');
      const mm = minuteText ?? '00';
      const instant =
        timeZone === 'Asia/Tokyo'
          ? new Date(`${dateKey}T${hh}:${mm}:00+09:00`)
          : new Date(`${dateKey}T${hh}:${mm}:00Z`);
      if (!Number.isNaN(instant.getTime())) {
        departures.push(instant);
      }
    }
  }

  return [...new Set(departures.map((item) => item.getTime()))]
    .sort((left, right) => left - right)
    .map((value) => new Date(value));
}

export async function fetchOdptStationDepartures(options: {
  consumerKey: string;
  stationId: string;
  operatorId?: string;
  targetDate: Date;
  timeZone: string;
  fetchImpl?: OdptFetch;
  timeoutMs?: number;
}): Promise<Date[] | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 4_000;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetchImpl(
      buildOdptStationTimetableUrl({
        consumerKey: options.consumerKey,
        stationId: options.stationId,
        operatorId: options.operatorId,
      }),
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OdptStationTimetable[];
    const departures = mapOdptDepartures(payload, options.targetDate, options.timeZone);
    return departures.length > 0 ? departures : null;
  } catch {
    return null;
  }
}
