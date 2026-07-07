export type IntegrationHealth = {
  integrationId: string;
  healthy: boolean;
  detail: string;
};

export interface IntegrationAdapter {
  readonly integrationId: string;
  readonly name: string;
  healthCheck(): Promise<IntegrationHealth>;
  sync?(actorId: string): Promise<unknown>;
  export?(actorId: string): Promise<unknown>;
}

export type IntegrationSummary = {
  integrationId: string;
  name: string;
  syncSupported: boolean;
  exportSupported: boolean;
};
