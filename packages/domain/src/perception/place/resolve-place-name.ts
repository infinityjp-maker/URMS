import { reverseGeocodePlaceName, type ReverseGeocodeOptions } from './reverse-geocode.js';

export type WeatherCoords = {
  latitude: number;
  longitude: number;
};

/** GPS 座標は常に逆ジオコーディング。SSOT のみのときは metadata.place_name 優先 */
export async function resolvePlaceName(
  coords: WeatherCoords | undefined,
  storedPlaceName: string | null | undefined,
  options: ReverseGeocodeOptions = {},
  preferReverseGeocode = false,
): Promise<string | null> {
  if (!coords) {
    return storedPlaceName?.trim() || null;
  }

  if (!preferReverseGeocode && storedPlaceName?.trim()) {
    return storedPlaceName.trim();
  }

  const resolved = await reverseGeocodePlaceName(coords.latitude, coords.longitude, options);
  return resolved ?? storedPlaceName?.trim() ?? null;
}
