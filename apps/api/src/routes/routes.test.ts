import { describe, expect, it } from 'vitest';

import { createApp } from '../create-app.js';
import type { AppServices } from '../types/services.js';

function createMockServices(): AppServices {
  return {
    resourceService: {} as AppServices['resourceService'],
    contextService: {} as AppServices['contextService'],
    aiManager: {} as AppServices['aiManager'],
    auditLogRepository: {} as AppServices['auditLogRepository'],
  };
}

describe('Health route', () => {
  it('returns ok status without authentication', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        status: 'ok',
        version: '0.2.0',
      },
    });

    await app.close();
  });
});

describe('Mode routes', () => {
  it('returns current mode from header', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes/current',
      headers: {
        'x-urms-mode': 'plan',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { mode: 'plan' } });

    await app.close();
  });

  it('rejects invalid mode header', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes/current',
      headers: {
        'x-urms-mode': 'invalid',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');

    await app.close();
  });
});

describe('Audit route authorization', () => {
  it('denies audit logs outside audit mode', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/audit/logs',
      headers: {
        'x-urms-mode': 'operate',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');

    await app.close();
  });
});

describe('AI route feature flag', () => {
  it('denies AI routes when ff.ai.enabled is off', async () => {
    const previous = process.env.URMS_FF_AI_ENABLED;
    process.env.URMS_FF_AI_ENABLED = 'false';

    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/ai/providers',
      headers: { 'x-urms-mode': 'plan' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FEATURE_DISABLED');

    process.env.URMS_FF_AI_ENABLED = previous;
    await app.close();
  });
});
