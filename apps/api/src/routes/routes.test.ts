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
    relationService: {
      list: vi.fn(async () => []),
      listForResource: vi.fn(async () => [
        {
          id: 'rel-1',
          fromType: 'digital',
          fromId: 'license-01',
          toType: 'physical',
          toId: 'server-01',
          relationType: 'depends_on',
          createdAt: '2026-07-05T00:00:00.000Z',
        },
      ]),
      create: vi.fn(async (input) => ({
        id: 'rel-new',
        ...input,
        createdAt: '2026-07-05T00:00:00.000Z',
      })),
      delete: vi.fn(async () => undefined),
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
      advanceTask: vi.fn(async () => ({
        items: [{ key: 'current_task', summary: 'advanced', ssotLinks: [] }],
        activeMode: 'operate',
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
    weatherService: {
      getCurrentWeather: vi.fn(async () => ({
        tempC: 18,
        precipitationPct: 20,
        humidityPct: 55,
        windKmh: 6,
        hint: '穏やかな天気です',
      })),
    },
    scheduleService: {
      getTodayEvents: vi.fn(async () => [
        { time: '10:00', title: 'デイリー', tone: 'calm' as const },
      ]),
    },
    aiTeamSyncService: {
      sync: vi.fn(async () => ({
        created: 3,
        updated: 40,
        skipped: 1,
        relationsCreated: 7,
        items: [],
      })),
    },
    scheduleSyncService: {
      sync: vi.fn(async () => ({
        created: 2,
        updated: 0,
        skipped: 0,
        items: [],
      })),
    },
    locationSyncService: {
      sync: vi.fn(async () => ({
        created: 1,
        updated: 0,
        skipped: 0,
        items: [],
      })),
    },
    loopJournalService: {
      append: vi.fn(async () => undefined),
      recordAdvance: vi.fn(async () => null),
      readRecent: vi.fn(async () => []),
    },
    integrationRegistry: {
      list: vi.fn(() => [
        { integrationId: 'cursor-local', name: 'Cursor Local Workspace', syncSupported: true },
      ]),
      require: vi.fn(),
      healthCheck: vi.fn(async () => ({
        integrationId: 'cursor-local',
        healthy: true,
        detail: 'Workspace OK',
      })),
      sync: vi.fn(async () => ({
        created: 3,
        updated: 40,
        skipped: 1,
        relationsCreated: 7,
        items: [],
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
        version: '1.0.0',
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
        version: '1.0.0',
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
        version: '1.0.0',
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
  it('lists core modes by default', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    delete process.env.URMS_FF_DEVELOP_ENABLED;

    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(3);

    process.env.URMS_FF_DEVELOP_ENABLED = previous;
    await app.close();
  });

  it('includes develop mode when feature flag is on', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    process.env.URMS_FF_DEVELOP_ENABLED = 'true';

    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(4);
    expect(response.json().data.map((item: { id: string }) => item.id)).toContain('develop');

    process.env.URMS_FF_DEVELOP_ENABLED = previous;
    await app.close();
  });

  it('rejects develop mode header when feature flag is off', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    delete process.env.URMS_FF_DEVELOP_ENABLED;

    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/modes/current',
      headers: {
        'x-urms-mode': 'develop',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FEATURE_DISABLED');

    process.env.URMS_FF_DEVELOP_ENABLED = previous;
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
    const body = response.json() as {
      data: { statusLine: string; weather: { tempC: number }; nextEvents: Array<{ title: string }> };
      meta: { canAdvanceTask: boolean; sources: { scheduleEvents: number; weather: string; loopJournalEntries: number; loopContinuity: string; relations: number; relationTypes: Record<string, number> } };
    };
    expect(body.data.statusLine).toBe('Phase 4 進行中');
    expect(body.data.weather.tempC).toBe(18);
    expect(body.data.nextEvents[0]?.title).toBe('デイリー');
    expect(body.meta.sources.scheduleEvents).toBe(1);
    expect(body.meta.sources.weather).toBe('live');
    expect(body.meta.sources.loopJournalEntries).toBe(0);
    expect(body.meta.sources.loopContinuity).toBe('none');
    expect(body.meta.sources.relations).toBe(0);
    expect(body.meta.sources.relationTypes).toEqual({});

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

  it('records loop journal when advancing task', async () => {
    const services = createMockServices();
    const before = {
      activeMode: 'operate' as const,
      items: [
        { key: 'current_task', summary: 'VT-1 task', ssotLinks: [] },
        { key: 'next_task', summary: 'VT-2 task', ssotLinks: [] },
      ],
      updatedAt: '2026-07-05T00:00:00.000Z',
    };
    const after = {
      ...before,
      items: [
        { key: 'current_task', summary: 'VT-2 task', ssotLinks: [] },
        { key: 'next_task', summary: '次を plan Mode で設定', ssotLinks: [] },
      ],
    };

    services.contextService.getDashboard = vi.fn(async () => before);
    services.contextService.advanceTask = vi.fn(async () => after);

    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/context/advance-task',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.loopJournalService.recordAdvance).toHaveBeenCalledWith(before, after, expect.any(String));

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

describe('Relation routes (S14)', () => {
  it('lists relations for a resource', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/resources/physical/server-01/relations',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].relationType).toBe('depends_on');
    await app.close();
  });

  it('creates a relation', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/relations',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        fromType: 'digital',
        fromId: 'license-01',
        toType: 'physical',
        toId: 'server-01',
        relationType: 'depends_on',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.id).toBe('rel-new');
    await app.close();
  });
});

describe('AI Team routes (S15)', () => {
  it('syncs AI team resources from repo files', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/ai-team/sync',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.created).toBe(3);
    expect(services.aiTeamSyncService.sync).toHaveBeenCalledOnce();
    await app.close();
  });
});

describe('Integration routes (S16)', () => {
  it('lists integrations', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/integrations',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].integrationId).toBe('cursor-local');
    await app.close();
  });

  it('checks integration health', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/integrations/cursor-local/health',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.healthy).toBe(true);
    expect(services.integrationRegistry.healthCheck).toHaveBeenCalledWith('cursor-local');
    await app.close();
  });

  it('syncs integration in develop mode', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    process.env.URMS_FF_DEVELOP_ENABLED = 'true';

    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/integrations/cursor-local/sync',
      headers: { 'x-urms-mode': 'develop' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.integrationRegistry.sync).toHaveBeenCalledWith('cursor-local', expect.any(String));
    process.env.URMS_FF_DEVELOP_ENABLED = previous;
    await app.close();
  });

  it('denies integration sync outside develop mode', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    process.env.URMS_FF_DEVELOP_ENABLED = 'true';

    const app = await createApp({ services: createMockServices(), logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/integrations/cursor-local/sync',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');
    process.env.URMS_FF_DEVELOP_ENABLED = previous;
    await app.close();
  });
});

describe('Security gate (S13)', () => {
  it('sets helmet headers when security plugins enabled', async () => {
    const app = await createApp({ services: createMockServices(), logger: false, security: true });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');

    await app.close();
  });

  it('registers AI chat route with rate limit config', async () => {
    const app = await createApp({ services: createMockServices(), logger: false, security: true });
    const route = app.printRoutes({ commonPrefix: false });
    expect(route).toContain('v1/ai/chat');

    await app.close();
  });
});
