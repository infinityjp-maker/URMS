import { describe, expect, it, vi } from 'vitest';

import { OllamaAdapter } from './ollama-adapter.js';

describe('OllamaAdapter', () => {
  it('returns chat response from Ollama API', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        message: { content: 'hello back' },
        prompt_eval_count: 3,
        eval_count: 5,
      }),
    );

    const adapter = new OllamaAdapter({ fetchImpl });
    const response = await adapter.chat({
      modelId: 'llama3.2',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(response.content).toBe('hello back');
    expect(response.providerId).toBe('ollama');
    expect(response.usage.totalTokens).toBe(8);
  });

  it('reports unhealthy when tags endpoint fails', async () => {
    const fetchImpl = vi.fn(async () => Response.json({}, { status: 503 }));
    const adapter = new OllamaAdapter({ fetchImpl });

    const health = await adapter.healthCheck();
    expect(health.healthy).toBe(false);
  });
});
