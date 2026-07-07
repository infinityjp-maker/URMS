import {
  buildPerceptionMeta,
  buildPerceptionState,
  resolvePlaceName,
  resolvePrimaryLocationForMode,
  resolveRelationGraphSignal,
} from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

function parseCoordQuery(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function registerPerceptionRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get('/v1/perception', async (request) => {
    const now = new Date();
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

    const dashboard = await services.contextService.getDashboard(request.urmsMode);

    const [weather, nextEvents, loopJournal, graph, placeName] = await Promise.all([
      services.weatherService.getCurrentWeather(deviceCoords),
      services.scheduleService.getTodayEvents(request.urmsMode, now),
      services.loopJournalService.readRecent(20),
      resolveRelationGraphSignal(services.relationService, request.urmsMode),
      resolvePlaceName(
        weatherCoords,
        primaryLocation?.placeName ?? null,
        {},
        Boolean(deviceCoords),
      ),
    ]);

    const state = buildPerceptionState(dashboard, now, {
      weather,
      nextEvents,
      loopJournal,
      graphSignal: graph,
      locationLabel: primaryLocation?.label ?? null,
    });

    return {
      data: state,
      meta: buildPerceptionMeta(
        dashboard,
        state,
        loopJournal,
        now,
        graph,
        primaryLocation?.label ?? null,
        deviceCoords ? 'device' : primaryLocation ? 'ssot' : null,
        placeName,
      ),
    };
  });
}
