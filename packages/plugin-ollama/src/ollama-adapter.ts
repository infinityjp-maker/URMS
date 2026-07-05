import {
  AppError,
  ERROR_CODES,
  type AiCapability,
  type AiChatRequest,
  type AiChatResponse,
  type AiProviderHealth,
} from '@urms/shared';
import type { AiFetch, AiProviderAdapter } from '@urms/domain';

export interface OllamaAdapterOptions {
  baseUrl?: string;
  fetchImpl?: AiFetch;
}

interface OllamaChatResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaAdapter implements AiProviderAdapter {
  readonly providerId = 'ollama';
  private readonly baseUrl: string;
  private readonly fetchImpl: AiFetch;

  constructor(options: OllamaAdapterOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getCapabilities(): AiCapability[] {
    return ['chat'];
  }

  supportsCapability(capability: AiCapability): boolean {
    return capability === 'chat';
  }

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const started = Date.now();

    const response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new AppError(
        ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
        `Ollama chat failed: HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as OllamaChatResponse;
    const promptTokens = payload.prompt_eval_count ?? 0;
    const completionTokens = payload.eval_count ?? 0;

    return {
      content: payload.message?.content ?? '',
      providerId: this.providerId,
      modelId: request.modelId,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      latencyMs: Date.now() - started,
    };
  }

  async healthCheck(): Promise<AiProviderHealth> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return {
          providerId: this.providerId,
          healthy: false,
          message: `HTTP ${response.status}`,
        };
      }

      return { providerId: this.providerId, healthy: true };
    } catch (error) {
      return {
        providerId: this.providerId,
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
