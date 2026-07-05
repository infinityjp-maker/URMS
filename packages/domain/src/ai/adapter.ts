import type { AiCapability, AiChatRequest, AiChatResponse, AiProviderHealth } from '@urms/shared';

export interface AiProviderAdapter {
  readonly providerId: string;
  getCapabilities(): AiCapability[];
  supportsCapability(capability: AiCapability): boolean;
  chat(request: AiChatRequest): Promise<AiChatResponse>;
  healthCheck(): Promise<AiProviderHealth>;
}

export type AiFetch = typeof fetch;
