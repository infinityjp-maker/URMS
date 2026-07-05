import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES, type ResourceEntity } from '@urms/shared';

import { createApp } from '../create-app.js';
import type { AppServices } from '../types/services.js';

const sampleResource: ResourceEntity = {
  resourceType: 'physical',
  resourceId: 'server-01',
  name: 'Server 01',
  status: 'draft',
  metadata: { location: 'rack-a' },
  createdAt: '2026-07-05T00:00:00.000Z',
  updatedAt: '2026-07-05T00:00:00.000Z',
};

function createMockServices(overrides: Partial<AppServices> = {}): AppServices {
  return {
    resourceService: {
      list: vi.fn(async () => ({ items: [sampleResource], total: 1, page: 1, limit: 20 })),
      create: vi.fn(async (input) => ({
        ...sampleResource,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        name: input.name,
        metadata: input.metadata ?? {},
      })),
      getByRef: vi.fn(async () => sampleResource),
      update: vi.fn(async (_type, _id, input) => ({
        ...sampleResource,
        name: input.name ?? sampleResource.name,
        metadata: input.metadata ?? sampleResource.metadata,
      })),
      changeLifecycle: vi.fn(async (_type, _id, status) => ({
        ...sampleResource,
        status,
      })),
    },
    contextService: {
      getDashboard: vi.fn(async () => ({
        items: [{ key: 'current_task', summary: 'task', ssotLinks: [] }],
        updatedAt: '2026-07-05T00:00:00.000Z',
      })),
      update: vi.fn(async (_items, _actor, mode) => ({
        items: [{ key: 'current_task', summary: 'updated', ssotLinks: [] }],
        updatedAt: '2026-07-05T00:00:00.000Z',
        mode,
      })),
    },
    aiManager: {
      listProviders: vi.fn(() => [{ providerId: 'ollama', capabilities: ['chat'] }]),
      healthCheck: vi.fn(async (providerId: string) => ({
        providerId,
        healthy: true,
      })),
      chat: vi.fn(async () => ({
        content: 'hello',
        providerId: 'ollama',
        modelId: 'llama3.2',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        latencyMs: 5,
      })),
    },
    pluginRegistry: {
      list: vi.fn(() => [{ resourceType: 'physical', version: '1.0.0', coreVersion: '0.2.0' }]),
      get: vi.fn(),
      require: vi.fn(),
      register: vi.fn(),
    },
    auditLogRepository: {
      append: vi.fn(),
      list: vi.fn(async () => ({
        items: [
          {
            id: 'log-1',
            action: 'CREATE',
            resourceType: 'physical',
            resourceId: 'server-01',
            actorId: 'user-1',
            mode: 'operate',
            payload: {},
            createdAt: '2026-07-05T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      })),
    },
    localAuthService: {
      login: vi.fn(async () => ({
        accessToken: 'test-token',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
        user: {
          id: 'user-1',
          externalId: 'operator',
          email: 'operator@local',
          roles: ['operator'],
        },
      })),
    },
    checkReadiness: vi.fn(async () => ({ database: 'ok' as const })),
    ...overrides,
  } as AppServices;
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

  it('returns ready when database check passes', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        status: 'ready',
        version: '0.2.0',
        checks: { database: 'ok' },
      },
    });

    await app.close();
  });

  it('returns not_ready when database check fails', async () => {
    const app = await createApp({
      services: createMockServices({
        checkReadiness: vi.fn(async () => ({ database: 'unavailable' as const })),
      }),
      logger: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      data: {
        status: 'not_ready',
        version: '0.2.0',
        checks: { database: 'unavailable' },
      },
    });

    await app.close();
  });
});

describe('Metrics route', () => {
  it('returns prometheus counters without authentication', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    await app.inject({ method: 'GET', url: '/health' });
    const response = await app.inject({ method: 'GET', url: '/metrics' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.body).toContain('urms_http_requests_total');
    expect(response.body).toContain('urms_http_errors_total');

    await app.close();
  });
});

describe('Mode routes', () => {
  it('lists available modes', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(3);

    await app.close();
  });

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

describe('Resource routes', () => {
  it('lists resources', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/resources?type=physical&q=Server',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(services.resourceService.list).toHaveBeenCalledOnce();

    await app.close();
  });

  it('creates resource', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        resourceType: 'physical',
        resourceId: 'new-1',
        name: 'New Server',
        metadata: { location: 'rack-b' },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(services.resourceService.create).toHaveBeenCalledOnce();

    await app.close();
  });

  it('gets, updates, archives, and changes lifecycle', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const headers = { 'x-urms-mode': 'operate' };

    const getResponse = await app.inject({
      method: 'GET',
      url: '/v1/resources/physical/server-01',
      headers,
    });
    expect(getResponse.statusCode).toBe(200);

    const patchResponse = await app.inject({
      method: 'PATCH',
      url: '/v1/resources/physical/server-01',
      headers,
      payload: { name: 'Updated Server' },
    });
    expect(patchResponse.statusCode).toBe(200);

    const lifecycleResponse = await app.inject({
      method: 'PATCH',
      url: '/v1/resources/physical/server-01/lifecycle',
      headers,
      payload: { status: 'active' },
    });
    expect(lifecycleResponse.statusCode).toBe(200);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/v1/resources/physical/server-01',
      headers,
    });
    expect(deleteResponse.statusCode).toBe(200);

    await app.close();
  });

  it('rejects invalid lifecycle status', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/resources/physical/server-01/lifecycle',
      headers: { 'x-urms-mode': 'operate' },
      payload: { status: 'invalid-status' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe(ERROR_CODES.VALIDATION_REQUIRED_FIELD);

    await app.close();
  });
});

describe('Perception routes', () => {
  it('returns perception payload from context', async () => {
    const services = createMockServices();
    services.contextService.getDashboard = vi.fn(async () => ({
      activeMode: 'operate',
      items: [
        {
          key: 'project_status',
          summary: 'Phase 4 進行中',
          ssotLinks: [],
          updatedAt: '2026-07-05T00:00:00.000Z',
          updatedBy: 'system',
        },
      ],
    }));

    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/perception',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { statusLine: string; aiMemo: string } };
    expect(body.data.statusLine).toBe('Phase 4 進行中');

    await app.close();
  });
});

describe('Context routes', () => {
  it('gets and updates dashboard in plan mode', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const getResponse = await app.inject({
      method: 'GET',
      url: '/v1/context',
      headers: { 'x-urms-mode': 'plan' },
    });
    expect(getResponse.statusCode).toBe(200);

    const putResponse = await app.inject({
      method: 'PUT',
      url: '/v1/context',
      headers: { 'x-urms-mode': 'plan' },
      payload: {
        items: [{ key: 'current_task', summary: 'updated', ssotLinks: [] }],
      },
    });
    expect(putResponse.statusCode).toBe(200);
    expect(services.contextService.update).toHaveBeenCalledOnce();

    await app.close();
  });
});

describe('Plugin routes', () => {
  it('lists resource type plugins', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/plugins/resource-types',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].resourceType).toBe('physical');

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

  it('returns audit logs in audit mode', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/audit/logs?page=1&limit=10',
      headers: {
        'x-urms-mode': 'audit',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(services.auditLogRepository.list).toHaveBeenCalledOnce();

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

  it('allows AI routes when ff.ai.enabled is on', async () => {
    const previous = process.env.URMS_FF_AI_ENABLED;
    process.env.URMS_FF_AI_ENABLED = 'true';

    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const headers = { 'x-urms-mode': 'plan' };

    const providersResponse = await app.inject({
      method: 'GET',
      url: '/v1/ai/providers',
      headers,
    });
    expect(providersResponse.statusCode).toBe(200);

    const healthResponse = await app.inject({
      method: 'GET',
      url: '/v1/ai/providers/ollama/health',
      headers,
    });
    expect(healthResponse.statusCode).toBe(200);

    const chatResponse = await app.inject({
      method: 'POST',
      url: '/v1/ai/chat',
      headers,
      payload: {
        modelId: 'llama3.2',
        messages: [{ role: 'user', content: 'hello' }],
      },
    });
    expect(chatResponse.statusCode).toBe(200);
    expect(services.aiManager.chat).toHaveBeenCalledOnce();

    process.env.URMS_FF_AI_ENABLED = previous;
    await app.close();
  });
});

describe('Error handler', () => {
  it('maps domain errors to HTTP responses', async () => {
    const services = createMockServices({
      resourceService: {
        ...createMockServices().resourceService,
        getByRef: vi.fn(async () => {
          throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'missing');
        }),
      },
    });
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/resources/physical/missing',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);

    await app.close();
  });
});
