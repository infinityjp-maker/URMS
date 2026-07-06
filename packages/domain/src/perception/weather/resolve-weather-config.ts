import type { ResourceEntity, UrmsMode } from '@urms/shared';

import type { ResourceRepository } from '../../repository/resource-repository.js';
import { resolveWeatherConfig, type WeatherConfig } from './weather-config.js';

export const LOCATION_RESOURCE_TYPE = 'location';

type LocationMetadata = {
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
  primary?: unknown;
};

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isPrimary(metadata: LocationMetadata): boolean {
  return metadata.primary === true || metadata.primary === 'true';
}

export function pickPrimaryLocationLabel(items: ResourceEntity[]): string | null {
  const primary =
    items.find((item) => isPrimary(item.metadata as LocationMetadata)) ?? items[0];
  const label = primary?.name?.trim();
  return label || null;
}

export function weatherConfigFromLocationResource(
  resource: ResourceEntity,
  baseConfig: WeatherConfig,
): WeatherConfig | null {
  const metadata = resource.metadata as LocationMetadata;
  const latitude = parseCoordinate(metadata.latitude);
  const longitude = parseCoordinate(metadata.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  const timezone =
    typeof metadata.timezone === 'string' && metadata.timezone.trim()
      ? metadata.timezone.trim()
      : baseConfig.timezone;

  return {
    enabled: baseConfig.enabled,
    latitude,
    longitude,
    timezone,
  };
}

export async function resolvePrimaryLocationLabel(
  repository: ResourceRepository | undefined,
): Promise<string | null> {
  if (!repository) {
    return null;
  }

  try {
    const { items } = await repository.list({
      resourceType: LOCATION_RESOURCE_TYPE,
      status: 'active',
      limit: 16,
    });

    return pickPrimaryLocationLabel(items);
  } catch {
    return null;
  }
}

type LocationListReader = {
  list(
    filter: { resourceType: string; status: string; limit?: number },
    mode: UrmsMode,
  ): Promise<{ items: ResourceEntity[] }>;
};

export async function resolvePrimaryLocationLabelForMode(
  reader: LocationListReader | undefined,
  mode: UrmsMode,
): Promise<string | null> {
  if (!reader) {
    return null;
  }

  try {
    const { items } = await reader.list(
      { resourceType: LOCATION_RESOURCE_TYPE, status: 'active', limit: 16 },
      mode,
    );

    return pickPrimaryLocationLabel(items);
  } catch {
    return null;
  }
}

export async function resolveWeatherConfigWithLocation(
  repository: ResourceRepository | undefined,
  baseConfig: WeatherConfig,
): Promise<WeatherConfig> {
  if (!repository) {
    return baseConfig;
  }

  try {
    const { items } = await repository.list({
      resourceType: LOCATION_RESOURCE_TYPE,
      status: 'active',
      limit: 16,
    });

    const primary = items.find((item) => isPrimary(item.metadata as LocationMetadata)) ?? items[0];
    if (!primary) {
      return baseConfig;
    }

    return weatherConfigFromLocationResource(primary, baseConfig) ?? baseConfig;
  } catch {
    return baseConfig;
  }
}

export { resolveWeatherConfig };
