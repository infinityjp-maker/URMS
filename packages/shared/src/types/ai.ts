export const AI_CAPABILITIES = ['chat', 'streaming'] as const;

export type AiCapability = (typeof AI_CAPABILITIES)[number];

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  modelId: string;
  messages: AiChatMessage[];
  providerId?: string;
}

export interface AiTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiChatResponse {
  content: string;
  providerId: string;
  modelId: string;
  usage: AiTokenUsage;
  latencyMs: number;
}

export interface AiProviderHealth {
  providerId: string;
  healthy: boolean;
  message?: string;
}

export interface AiProviderInfo {
  providerId: string;
  capabilities: AiCapability[];
}

export interface AiUsageRecord {
  providerId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costUsd?: number;
  actorId: string;
  mode: string;
  createdAt: string;
}
