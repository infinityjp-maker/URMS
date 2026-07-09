import type {
  OperationsDetailPayload,
  OperationsListPayload,
  OperationFlowId,
  UrmsMode,
} from '@urms/shared';

import type { IntegrationRegistry } from '../integration/integration-registry.js';
import {
  buildOperationFlowDetail,
  buildOperationFlows,
  isOperationFlowId,
  type OperationsSnapshot,
} from './operation-flows.js';
import type { TransportService } from '../perception/transport/transport-service.js';

export interface OperationsService {
  listFlows(mode: UrmsMode): Promise<OperationsListPayload>;
  getFlowDetail(flowId: OperationFlowId, mode: UrmsMode): Promise<OperationsDetailPayload | null>;
}

export type OperationsServiceOptions = {
  checkReadiness: () => Promise<{ database: 'ok' | 'unavailable' }>;
  transportService: TransportService;
  integrationRegistry: IntegrationRegistry;
  scheduleEnabled?: boolean;
  transportEnabled?: boolean;
  weatherProbe?: () => Promise<'live' | 'empty'>;
};

export class ResourceOperationsService implements OperationsService {
  private readonly options: OperationsServiceOptions;

  constructor(options: OperationsServiceOptions) {
    this.options = options;
  }

  private async collectSnapshot(mode: UrmsMode): Promise<OperationsSnapshot> {
    const readiness = await this.options.checkReadiness();
    const transport = await this.options.transportService.getDepartureAdvice(mode);
    const integrations = await Promise.all(
      this.options.integrationRegistry.list().map(async (item) => {
        const health = await this.options.integrationRegistry.healthCheck(item.integrationId);
        return {
          integrationId: item.integrationId,
          name: item.name,
          healthy: health.healthy,
          detail: health.detail,
        };
      }),
    );

    const weather = this.options.weatherProbe ? await this.options.weatherProbe() : 'empty';

    return {
      checkedAt: new Date(),
      apiHealthy: true,
      database: readiness.database,
      weather,
      scheduleEnabled: this.options.scheduleEnabled ?? true,
      transportEnabled: this.options.transportEnabled ?? true,
      transportHasAdvice: transport.advice !== null,
      timetableSource: transport.timetableSource ?? 'unknown',
      integrations,
    };
  }

  async listFlows(mode: UrmsMode): Promise<OperationsListPayload> {
    const snapshot = await this.collectSnapshot(mode);
    return buildOperationFlows(snapshot);
  }

  async getFlowDetail(flowId: OperationFlowId, mode: UrmsMode): Promise<OperationsDetailPayload | null> {
    if (!isOperationFlowId(flowId)) {
      return null;
    }

    const snapshot = await this.collectSnapshot(mode);
    const flow = buildOperationFlowDetail(flowId, snapshot);
    return flow ? { flow } : null;
  }
}

export function createOperationsService(options: OperationsServiceOptions): OperationsService {
  return new ResourceOperationsService(options);
}
