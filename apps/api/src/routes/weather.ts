import { resolvePrimaryLocationForMode } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

function parseCoordQuery(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function registerWeatherRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/weather/weekly', async (request) => {
    const latitude = parseCoordQuery((request.query as { latitude?: unknown }).latitude);
    const longitude = parseCoordQuery((request.query as { longitude?: unknown }).longitude);
    const deviceCoords =
      latitude !== null && longitude !== null ? { latitude, longitude } : undefined;

    const primaryLocation = await resolvePrimaryLocationForMode(
      services.resourceService,
      request.urmsMode,
    );

    const weatherCoords = deviceCoords
      ? { latitude: deviceCoords.latitude, longitude: deviceCoords.longitude }
      : primaryLocation
        ? { latitude: primaryLocation.latitude, longitude: primaryLocation.longitude }
        : undefined;

    const data = await services.weatherService.getWeeklyForecast(weatherCoords);
    return { data };
  });

  app.get('/v1/weather/hourly', async (request) => {
    const latitude = parseCoordQuery((request.query as { latitude?: unknown }).latitude);
    const longitude = parseCoordQuery((request.query as { longitude?: unknown }).longitude);
    const deviceCoords =
      latitude !== null && longitude !== null ? { latitude, longitude } : undefined;

    const primaryLocation = await resolvePrimaryLocationForMode(
      services.resourceService,
      request.urmsMode,
    );

    const weatherCoords = deviceCoords
      ? { latitude: deviceCoords.latitude, longitude: deviceCoords.longitude }
      : primaryLocation
        ? { latitude: primaryLocation.latitude, longitude: primaryLocation.longitude }
        : undefined;

    const data = await services.weatherService.getHourlyForecast(weatherCoords);
    return { data };
  });
}
