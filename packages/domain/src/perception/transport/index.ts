import type { DepartureAdvice, TransportDeparturePayload } from '@urms/shared';

export type { DepartureAdvice, TransportDeparturePayload };

export {
  adviseDeparture,
  buildStationDeparturesForDay,
  formatClockTime,
  type DepartureAdviceResult,
} from './departure-advice.js';
export { adviseRoute, type RouteAdviceResult } from './route-advice.js';
export { resolveTransportConfig, type TransportConfig } from './transport-config.js';
export { createTransportService, ResourceTransportService, type TransportService } from './transport-service.js';
