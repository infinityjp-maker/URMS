export type ReverseGeocodeResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

export type ReverseGeocodeFetch = typeof fetch;

export type ReverseGeocodeOptions = {
  fetchImpl?: ReverseGeocodeFetch;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 4_000;

/** BigDataCloud — API キー不要 · 日本語 locality */
export function buildReverseGeocodeUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'ja',
  });
  return `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`;
}

/** 知覚層向け — 市区町村レベルの短い地名 */
export function formatPlaceName(payload: ReverseGeocodeResponse): string | null {
  const locality = payload.locality?.trim();
  const city = payload.city?.trim();

  if (locality && city && locality !== city) {
    return `${city}${locality}`;
  }

  if (locality) {
    return locality;
  }

  if (city) {
    return city;
  }

  const region = payload.principalSubdivision?.trim();
  return region || null;
}

export async function reverseGeocodePlaceName(
  latitude: number,
  longitude: number,
  options: ReverseGeocodeOptions = {},
): Promise<string | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetchImpl(buildReverseGeocodeUrl(latitude, longitude), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ReverseGeocodeResponse;
    return formatPlaceName(payload);
  } catch {
    return null;
  }
}
