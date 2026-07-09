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
      list: vi.fn(async (filter) => {
        if (filter?.resourceType === 'location') {
          return { items: [], total: 0, page: 1, limit: filter.limit ?? 20 };
        }
        return { items: [sampleResource], total: 1, page: 1, limit: 20 };
      }),
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
      list: vi.fn(() => [{ resourceType: 'physical', version: '1.0.0', coreVersion: '1.4.0' }]),
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
      getWeeklyForecast: vi.fn(async () => ({
        timezone: 'Asia/Tokyo',
        source: 'live' as const,
        days: [
          {
            dateKey: '2026-07-09',
            weekdayLabel: '水',
            tempMaxC: 30,
            tempMinC: 24,
            precipitationPct: 20,
            precipitationMm: 0,
            illustrationId: 'clear-day' as const,
            summary: '穏やかな天気です',
          },
        ],
      })),
      getHourlyForecast: vi.fn(async () => ({
        timezone: 'Asia/Tokyo',
        source: 'live' as const,
        slots: [{ time: '09:00', precipitationPct: 20, tempC: 24 }],
      })),
    },
    scheduleService: {
      getTodayEvents: vi.fn(async () => [
        { time: '10:00', title: 'デイリー', tone: 'calm' as const },
      ]),
      getMonthEvents: vi.fn(async () => ({
        year: 2026,
        month: 7,
        timezone: 'Asia/Tokyo',
        googleConnected: false,
        days: {
          '2026-07-05': [{ time: '10:00', title: 'デイリー', tone: 'calm' as const, resourceId: 'evt-1', category: 'tv' as const }],
        },
      })),
    },
    googleCalendarService: {
      getStatus: vi.fn(async () => ({
        connected: false,
        statusNote: 'URMS_GOOGLE_CALENDAR_ICS_URL 未設定',
      })),
      getMonthEvents: vi.fn(async () => ({
        connected: false,
        statusNote: null,
        days: {},
      })),
    },
    transportService: {
      getDepartureAdvice: vi.fn(async () => ({
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
        advice: {
          eventTitle: '定例',
          eventTime: '10:00',
          stationName: '渋谷',
          recommendedTrainDeparture: '09:30',
          leaveHomeBy: '09:17',
          leaveInMinutes: 17,
          spareMinutes: 17,
          spareSuggestion: '余裕あり · 缶コーヒーなど短時間の余白可',
          headline: '09:17 までに家を出る',
          detail: '渋谷 09:30 発 · 徒歩 8 分 + 余裕 5 分',
        },
        route: {
          originStation: '渋谷',
          destinationLabel: '定例',
          trainDeparture: '09:30',
          estimatedArrival: '09:55',
          rideMinutes: 25,
          transferCount: 0,
          steps: ['渋谷 09:30 発 — 各駅停車', '09:55 到着予想 — 定例'],
          headline: '09:55 到着予想',
          detail: '渋谷 → 定例 · 乗車 25 分 · 予定 10:00 開始',
        },
        note: null,
        timetableSource: 'interval',
      })),
    },
    operationsService: {
      listFlows: vi.fn(async () => ({
        checkedAt: new Date().toISOString(),
        alertCount: 1,
        flows: [
          { id: 'api-server', name: 'API サーバー', status: 'ok', summary: '正常稼働中' },
          { id: 'database', name: 'データベース', status: 'ok', summary: '接続正常' },
        ],
      })),
      getFlowDetail: vi.fn(async (flowId: string) => ({
        flow: {
          id: flowId,
          name: 'API サーバー',
          status: 'ok',
          summary: '正常稼働中',
          checks: [{ label: 'API プロセス', status: 'ok', detail: 'ヘルスチェック応答あり' }],
          nextAction: '特になし',
          logs: ['checkedAt test'],
        },
      })),
    },
    knowledgeService: {
      listDocuments: vi.fn(async () => ({
        documents: [
          {
            id: 'readme',
            title: 'URMS ドキュメント概要',
            category: '概要',
            summary: 'docs 配下の入口',
          },
        ],
      })),
      getDocument: vi.fn(async (id: string) => {
        if (id !== 'readme') {
          return null;
        }
        return {
          id: 'readme',
          title: 'URMS ドキュメント概要',
          category: '概要',
          summary: 'docs 配下の入口',
          path: 'docs/README.md',
          content: '# URMS\n\nOverview',
        };
      }),
    },
    assetService: {
      listAssets: vi.fn(async () => ({
        source: 'catalog' as const,
        assets: [
          {
            id: 'gpu-rtx4070',
            name: 'NVIDIA RTX 4070',
            status: 'active',
            location: 'デスク PC',
            category: 'pc-part' as const,
            partType: 'gpu' as const,
            summary: '1440p GPU',
            budgetJpy: 85000,
          },
        ],
      })),
      getAsset: vi.fn(async (id: string) => {
        if (id !== 'gpu-rtx4070') {
          return null;
        }
        return {
          id: 'gpu-rtx4070',
          name: 'NVIDIA RTX 4070',
          status: 'active',
          location: 'デスク PC',
          category: 'pc-part' as const,
          partType: 'gpu' as const,
          summary: '1440p GPU',
          budgetJpy: 85000,
          notes: 'Test GPU',
        };
      }),
      listPcParts: vi.fn(async () => ({
        parts: [
          {
            id: 'gpu-rtx4070',
            name: 'NVIDIA RTX 4070',
            status: 'active',
            location: 'デスク PC',
            category: 'pc-part' as const,
            partType: 'gpu' as const,
            summary: '1440p GPU',
            budgetJpy: 85000,
          },
        ],
        roadmap: [{ phase: 'Phase 1', title: 'RAM', detail: '64GB', estimatedJpy: 20000 }],
        totalBudgetJpy: 85000,
      })),
    },
    storageService: {
      getOverview: vi.fn(async () => ({
        source: 'catalog' as const,
        totalUsedGb: 4390,
        totalCapacityGb: 7680,
        volumes: [
          {
            id: 'vol-system',
            name: 'システム SSD (C:)',
            kind: 'system' as const,
            path: 'C:\\',
            totalGb: 512,
            usedGb: 318,
            freeGb: 194,
            usagePct: 62,
            summary: 'OS · アプリ',
          },
        ],
      })),
      getVolume: vi.fn(async (id: string) => {
        if (id !== 'vol-system') {
          return null;
        }
        return {
          id: 'vol-system',
          name: 'システム SSD (C:)',
          kind: 'system' as const,
          path: 'C:\\',
          totalGb: 512,
          usedGb: 318,
          freeGb: 194,
          usagePct: 62,
          summary: 'OS · アプリ',
          largestItems: [{ label: 'Windows', sizeGb: 142 }],
          cleanupHint: 'pnpm store prune',
        };
      }),
      listCleanupTips: vi.fn(() => ['Docker: docker system prune']),
    },
    videoService: {
      getLibrary: vi.fn(async () => ({
        source: 'catalog' as const,
        totalSizeGb: 608,
        totalDurationMin: 976,
        items: [
          {
            id: 'vid-urms-demo',
            title: 'URMS 製品デモ',
            kind: 'export' as const,
            path: 'E:\\Media\\Exports\\demo.mp4',
            durationMin: 4,
            sizeGb: 0.8,
            resolution: '1920x1080',
            summary: 'screencast',
          },
        ],
      })),
      getVideo: vi.fn(async (id: string) => {
        if (id !== 'vid-urms-demo') {
          return null;
        }
        return {
          id: 'vid-urms-demo',
          title: 'URMS 製品デモ',
          kind: 'export' as const,
          path: 'E:\\Media\\Exports\\demo.mp4',
          durationMin: 4,
          sizeGb: 0.8,
          resolution: '1920x1080',
          summary: 'screencast',
          codec: 'H.264',
          tags: ['urms'],
          storageHint: 'Keep on E:',
        };
      }),
      listStoragePolicies: vi.fn(() => ['raw と export を混在させない']),
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
    loopSyncService: {
      sync: vi.fn(async () => ({
        created: 2,
        updated: 0,
        skipped: 0,
        items: [],
      })),
    },
    loopExportService: {
      export: vi.fn(async () => ({
        entryCount: 2,
        sourcePath: '.cursor/resources/loop/journal.md',
      })),
    },
    loopJournalService: {
      append: vi.fn(async () => undefined),
      recordAdvance: vi.fn(async () => null),
      readRecent: vi.fn(async () => []),
    },
    integrationRegistry: {
      list: vi.fn(() => [
        {
          integrationId: 'cursor-local',
          name: 'Cursor Local Workspace',
          syncSupported: true,
          exportSupported: true,
        },
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
      export: vi.fn(async () => ({
        aiTeam: {
          updated: 2,
          unchanged: 10,
          skipped: 1,
          conflicts: 0,
          items: [],
        },
        context: {
          updated: 1,
          unchanged: 2,
          skipped: 0,
          conflicts: 0,
          items: [],
        },
        conflicts: 0,
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
        version: '1.4.0',
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
        version: '1.4.0',
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
        version: '1.4.0',
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
      meta: { canAdvanceTask: boolean; sources: { scheduleEvents: number; weather: string; weatherCoords: string | null; loopJournalEntries: number; loopContinuity: string; loopNarrative: string | null; relations: number; relationTypes: Record<string, number>; placeName: string | null; location: string | null } };
    };
    expect(body.data.statusLine).toBe('Phase 4 進行中');
    expect(body.data.weather.tempC).toBe(18);
    expect(body.data.nextEvents[0]?.title).toBe('デイリー');
    expect(body.meta.sources.scheduleEvents).toBe(1);
    expect(body.meta.sources.weather).toBe('live');
    expect(body.meta.sources.weatherCoords).toBeNull();
    expect(body.meta.sources.loopJournalEntries).toBe(0);
    expect(body.meta.sources.loopContinuity).toBe('none');
    expect(body.meta.sources.loopNarrative).toBeNull();
    expect(body.meta.sources.relations).toBe(0);
    expect(body.meta.sources.relationTypes).toEqual({});
    expect(body.meta.sources.placeName).toBeNull();
    expect(body.meta.sources.location).toBeNull();

    await app.close();
  });

  it('returns calendar month payload', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/schedule/month?year=2026&month=7',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      data: { year: number; month: number; googleConnected: boolean; days: Record<string, unknown[]> };
    };
    expect(body.data.year).toBe(2026);
    expect(body.data.month).toBe(7);
    expect(body.data.googleConnected).toBe(false);
    expect(body.data.days['2026-07-05']).toHaveLength(1);
    expect(services.scheduleService.getMonthEvents).toHaveBeenCalled();

    await app.close();
  });

  it('returns google calendar status', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/schedule/google/status',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { connected: boolean; statusNote: string | null } };
    expect(body.data.connected).toBe(false);
    expect(body.data.statusNote).toContain('ICS_URL');
    expect(services.googleCalendarService.getStatus).toHaveBeenCalled();

    await app.close();
  });

  it('returns knowledge document list', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/knowledge/documents',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { documents: Array<{ id: string }> } };
    expect(body.data.documents[0]?.id).toBe('readme');
    expect(services.knowledgeService.listDocuments).toHaveBeenCalled();

    await app.close();
  });

  it('returns knowledge document detail', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/knowledge/documents/readme',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { id: string; content: string } };
    expect(body.data.id).toBe('readme');
    expect(body.data.content).toContain('URMS');
    expect(services.knowledgeService.getDocument).toHaveBeenCalledWith('readme');

    await app.close();
  });

  it('returns 404 for unknown knowledge document', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/knowledge/documents/missing',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);

    await app.close();
  });

  it('returns asset list', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/assets',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { assets: Array<{ id: string }>; source: string } };
    expect(body.data.assets[0]?.id).toBe('gpu-rtx4070');
    expect(services.assetService.listAssets).toHaveBeenCalled();

    await app.close();
  });

  it('returns pc parts payload', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/assets/pc-parts',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { totalBudgetJpy: number; roadmap: unknown[] } };
    expect(body.data.totalBudgetJpy).toBe(85000);
    expect(body.data.roadmap.length).toBeGreaterThan(0);
    expect(services.assetService.listPcParts).toHaveBeenCalled();

    await app.close();
  });

  it('returns weekly weather forecast', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather/weekly',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { days: Array<{ dateKey: string }>; source: string } };
    expect(body.data.source).toBe('live');
    expect(body.data.days[0]?.dateKey).toBe('2026-07-09');
    expect(services.weatherService.getWeeklyForecast).toHaveBeenCalled();

    await app.close();
  });

  it('returns hourly weather forecast', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather/hourly',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { slots: Array<{ time: string }>; source: string } };
    expect(body.data.source).toBe('live');
    expect(body.data.slots[0]?.time).toBe('09:00');
    expect(services.weatherService.getHourlyForecast).toHaveBeenCalled();

    await app.close();
  });

  it('returns storage overview', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/storage/overview',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { volumes: Array<{ id: string }>; source: string } };
    expect(body.data.source).toBe('catalog');
    expect(body.data.volumes[0]?.id).toBe('vol-system');
    expect(services.storageService.getOverview).toHaveBeenCalled();

    await app.close();
  });

  it('returns storage volume detail', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/storage/volumes/vol-system',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { id: string; cleanupHint: string } };
    expect(body.data.id).toBe('vol-system');
    expect(body.data.cleanupHint).toContain('pnpm');
    expect(services.storageService.getVolume).toHaveBeenCalledWith('vol-system', 'operate');

    await app.close();
  });

  it('returns 404 for unknown storage volume', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/storage/volumes/missing',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);

    await app.close();
  });

  it('returns video library', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/videos/library',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { items: Array<{ id: string }>; source: string } };
    expect(body.data.source).toBe('catalog');
    expect(body.data.items[0]?.id).toBe('vid-urms-demo');
    expect(services.videoService.getLibrary).toHaveBeenCalled();

    await app.close();
  });

  it('returns video detail', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/videos/vid-urms-demo',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { id: string; codec: string } };
    expect(body.data.id).toBe('vid-urms-demo');
    expect(body.data.codec).toBe('H.264');
    expect(services.videoService.getVideo).toHaveBeenCalledWith('vid-urms-demo', 'operate');

    await app.close();
  });

  it('returns 404 for unknown video', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/videos/missing',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);

    await app.close();
  });

  it('returns transport departure advice', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/transport/departure',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      data: { advice: { eventTitle: string } | null; stationName: string };
    };
    expect(body.data.stationName).toBe('渋谷');
    expect(body.data.advice?.eventTitle).toBe('定例');
    expect(services.transportService.getDepartureAdvice).toHaveBeenCalled();

    await app.close();
  });

  it('returns operations flow list', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/operations/flows',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { data: { flows: Array<{ id: string }>; alertCount: number } };
    expect(body.data.flows.length).toBeGreaterThan(0);
    expect(services.operationsService.listFlows).toHaveBeenCalled();

    await app.close();
  });

  it('passes device coordinates to weather service', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/perception?latitude=34.69&longitude=135.5',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.weatherService.getCurrentWeather).toHaveBeenCalledWith({
      latitude: 34.69,
      longitude: 135.5,
    });
    const body = response.json() as { meta: { sources: { weatherCoords: string | null } } };
    expect(body.meta.sources.weatherCoords).toBe('device');

    await app.close();
  });
});

describe('Loop sync routes', () => {
  it('syncs journal entries via POST /v1/loop/sync', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/loop/sync',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.loopSyncService.sync).toHaveBeenCalledWith(expect.any(String), 'operate');
    expect(response.json().data.created).toBe(2);

    await app.close();
  });

  it('exports journal markdown via POST /v1/loop/export', async () => {
    const services = createMockServices();
    const app = await createApp({ services, logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/loop/export',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.loopExportService.export).toHaveBeenCalledWith(expect.any(String), 'operate');
    expect(response.json().data.entryCount).toBe(2);

    await app.close();
  });

  it('denies loop sync outside operate/develop modes', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const auditResponse = await app.inject({
      method: 'POST',
      url: '/v1/loop/sync',
      headers: { 'x-urms-mode': 'audit' },
    });
    expect(auditResponse.statusCode).toBe(403);
    expect(auditResponse.json().error.code).toBe('MODE_NOT_ALLOWED');

    const planResponse = await app.inject({
      method: 'POST',
      url: '/v1/loop/sync',
      headers: { 'x-urms-mode': 'plan' },
    });
    expect(planResponse.statusCode).toBe(403);
    expect(planResponse.json().error.code).toBe('MODE_NOT_ALLOWED');

    await app.close();
  });

  it('denies loop export outside operate/develop modes', async () => {
    const app = await createApp({ services: createMockServices(), logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/loop/export',
      headers: { 'x-urms-mode': 'audit' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');

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
    services.loopJournalService.recordAdvance = vi.fn(async () => ({
      completed: 'VT-1 task',
      next: 'VT-2 task',
      actorId: 'local-dev',
      at: new Date('2026-07-06T10:00:00+09:00'),
    }));

    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/context/advance-task',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(services.loopJournalService.recordAdvance).toHaveBeenCalledWith(
      before,
      after,
      expect.any(String),
      'operate',
    );
    expect(response.json().meta.journalEntry).toEqual({
      completed: 'VT-1 task',
      next: 'VT-2 task',
      at: '2026-07-06T01:00:00.000Z',
    });

    await app.close();
  });
});

describe('VT-4 daily loop E2E', () => {
  it('connects advance-task journal to perception status and meta', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00+09:00'));

    type JournalEntry = {
      completed: string;
      next?: string;
      actorId: string;
      at: Date;
    };

    const journalStore: JournalEntry[] = [];
    const before = {
      activeMode: 'operate' as const,
      items: [
        { key: 'project_status', summary: 'Vision 体験 進行中', ssotLinks: [] },
        { key: 'current_task', summary: 'VT-1 task', ssotLinks: [] },
        { key: 'next_task', summary: 'VT-2 task', ssotLinks: [] },
      ],
    };
    const after = {
      activeMode: 'operate' as const,
      items: [
        {
          key: 'project_status',
          summary: '直近ループ 7/6 10:00 · 次: VT-2 task',
          ssotLinks: [],
        },
        { key: 'current_task', summary: 'VT-2 task', ssotLinks: [] },
        { key: 'next_task', summary: '次を plan Mode で設定', ssotLinks: [] },
      ],
    };

    let dashboard = before;
    const services = createMockServices();
    services.contextService.getDashboard = vi.fn(async () => dashboard);
    services.contextService.advanceTask = vi.fn(async () => {
      dashboard = after;
      return after;
    });
    services.loopJournalService.recordAdvance = vi.fn(async (_before, _after, actorId) => {
      const entry: JournalEntry = {
        completed: 'VT-1 task',
        next: 'VT-2 task',
        actorId,
        at: new Date(),
      };
      journalStore.push(entry);
      return entry;
    });
    services.loopJournalService.readRecent = vi.fn(async () => journalStore);

    const app = await createApp({ services, logger: false });

    const beforePerception = await app.inject({
      method: 'GET',
      url: '/v1/perception',
      headers: { 'x-urms-mode': 'operate' },
    });
    expect(beforePerception.statusCode).toBe(200);
    const beforeBody = beforePerception.json() as {
      data: { statusLine: string };
      meta: { sources: { loopJournalEntries: number; loopContinuity: string } };
    };
    expect(beforeBody.meta.sources.loopJournalEntries).toBe(0);
    expect(beforeBody.meta.sources.loopContinuity).toBe('none');

    const advanceResponse = await app.inject({
      method: 'POST',
      url: '/v1/context/advance-task',
      headers: { 'x-urms-mode': 'operate' },
    });
    expect(advanceResponse.statusCode).toBe(200);
    expect(advanceResponse.json().meta.journalEntry?.completed).toBe('VT-1 task');

    const afterPerception = await app.inject({
      method: 'GET',
      url: '/v1/perception',
      headers: { 'x-urms-mode': 'operate' },
    });
    expect(afterPerception.statusCode).toBe(200);
    const afterBody = afterPerception.json() as {
      data: { statusLine: string; aiMemo: string };
      meta: {
        sources: {
          loopJournalEntries: number;
          loopContinuity: string;
          loopNarrative: string | null;
        };
      };
    };

    expect(afterBody.meta.sources.loopJournalEntries).toBe(1);
    expect(afterBody.meta.sources.loopContinuity).toBe('looped-today');
    expect(afterBody.meta.sources.loopNarrative).toContain('VT-1 task');
    expect(afterBody.meta.sources.loopNarrative).toContain('→ 次: VT-2 task');
    expect(afterBody.data.statusLine).toContain('直近ループ');
    expect(afterBody.data.statusLine).toContain('VT-2 task');

    vi.useRealTimers();
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

  it('exports integration in develop mode', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    process.env.URMS_FF_DEVELOP_ENABLED = 'true';

    const services = createMockServices();
    const app = await createApp({ services, logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/integrations/cursor-local/export',
      headers: { 'x-urms-mode': 'develop' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.conflicts).toBe(0);
    expect(response.json().data.aiTeam.updated).toBe(2);
    expect(response.json().data.context.updated).toBe(1);
    expect(services.integrationRegistry.export).toHaveBeenCalledWith('cursor-local', expect.any(String));
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

  it('rejects develop mode when feature flag is disabled', async () => {
    const previous = process.env.URMS_FF_DEVELOP_ENABLED;
    delete process.env.URMS_FF_DEVELOP_ENABLED;

    const app = await createApp({ services: createMockServices(), logger: false, security: true });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'develop' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FEATURE_DISABLED');

    process.env.URMS_FF_DEVELOP_ENABLED = previous;
    await app.close();
  });
});
