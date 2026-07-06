export type DeviceCoords = {
  latitude: number;
  longitude: number;
};

const CACHE_MS = 60_000;

let cachedCoords: DeviceCoords | null = null;
let cachedAt = 0;

/** Browser geolocation — cached briefly to avoid hammering GPS on poll. */
export async function resolveDeviceLocation(): Promise<DeviceCoords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  const now = Date.now();
  if (cachedCoords && now - cachedAt < CACHE_MS) {
    return cachedCoords;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        cachedAt = Date.now();
        resolve(cachedCoords);
      },
      () => resolve(cachedCoords),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: CACHE_MS },
    );
  });
}
