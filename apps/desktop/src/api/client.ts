import type { AdvanceTaskResponse, CalendarMonthPayload, CalendarMonthResponse, GoogleCalendarStatusResponse, KnowledgeDocumentResponse, KnowledgeListResponse, OperationsDetailResponse, OperationsListResponse, PerceptionResponse, TransportDepartureResponse, UrmsMode } from '@urms/shared';

import type { DeviceCoords } from '../lib/device-location.js';
import { DESKTOP_CORE_MODES } from '../lib/urms-modes.js';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

type ApiEnvelope<T> = {
  data?: T;
};

type ApiListBody<T> = {
  data?: T[];
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string };

export type IntegrationSummary = {
  integrationId: string;
  name: string;
  syncSupported: boolean;
  exportSupported: boolean;
};

export type IntegrationHealth = {
  integrationId: string;
  healthy: boolean;
  detail: string;
};

async function fetchJson<T>(path: string, mode: UrmsMode, init?: RequestInit): Promise<T | null> {
  try {
    const method = init?.method?.toUpperCase() ?? 'GET';
    const usesJsonBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    const body = init?.body ?? (usesJsonBody ? '{}' : undefined);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-URMS-Mode': mode,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      method,
      body,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchJsonResult<T>(path: string, mode: UrmsMode, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const method = init?.method?.toUpperCase() ?? 'GET';
    const usesJsonBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    const body = init?.body ?? (usesJsonBody ? '{}' : undefined);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-URMS-Mode': mode,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      method,
      body,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    const payload = (await response.json()) as ApiEnvelope<T> | { error?: { message?: string } };
    if (!response.ok) {
      const message = 'error' in payload ? payload.error?.message : undefined;
      return { ok: false, error: message ?? `HTTP ${response.status}` };
    }

    if (!('data' in payload) || payload.data === undefined) {
      return { ok: false, error: '応答データがありません' };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: 'API に接続できません' };
  }
}

export async function fetchAvailableModes(mode: UrmsMode = 'operate'): Promise<readonly UrmsMode[]> {
  const body = await fetchJson<ApiListBody<{ id: UrmsMode }>>('/v1/modes', mode);
  if (!body?.data?.length) {
    return DESKTOP_CORE_MODES;
  }

  return body.data.map((item) => item.id);
}

export async function fetchHealth(mode: UrmsMode = 'operate'): Promise<boolean> {
  const body = await fetchJson<ApiEnvelope<{ status: string }>>('/health', mode);
  return body?.data?.status === 'ok';
}

export async function fetchReady(mode: UrmsMode = 'operate'): Promise<boolean> {
  const body = await fetchJson<ApiEnvelope<{ status: string }>>('/health/ready', mode);
  return body?.data?.status === 'ready';
}

export async function fetchPerception(
  mode: UrmsMode,
  deviceCoords?: DeviceCoords | null,
): Promise<PerceptionResponse | null> {
  const query =
    deviceCoords != null
      ? `?latitude=${encodeURIComponent(String(deviceCoords.latitude))}&longitude=${encodeURIComponent(String(deviceCoords.longitude))}`
      : '';
  const body = await fetchJson<PerceptionResponse>(`/v1/perception${query}`, mode);
  if (!body?.data) return null;
  return body;
}

export async function fetchCalendarMonth(
  mode: UrmsMode,
  year: number,
  month: number,
): Promise<CalendarMonthPayload | null> {
  const query = `?year=${encodeURIComponent(String(year))}&month=${encodeURIComponent(String(month))}`;
  const body = await fetchJson<CalendarMonthResponse>(`/v1/schedule/month${query}`, mode);
  return body?.data ?? null;
}

export async function fetchTransportDeparture(mode: UrmsMode) {
  const body = await fetchJson<TransportDepartureResponse>('/v1/transport/departure', mode);
  return body?.data ?? null;
}

export async function fetchOperationsFlows(mode: UrmsMode) {
  const body = await fetchJson<OperationsListResponse>('/v1/operations/flows', mode);
  return body?.data ?? null;
}

export async function fetchOperationsFlowDetail(mode: UrmsMode, flowId: string) {
  const body = await fetchJson<OperationsDetailResponse>(
    `/v1/operations/flows/${encodeURIComponent(flowId)}`,
    mode,
  );
  return body?.data ?? null;
}

export async function fetchKnowledgeDocuments(mode: UrmsMode) {
  const body = await fetchJson<KnowledgeListResponse>('/v1/knowledge/documents', mode);
  return body?.data ?? null;
}

export async function fetchKnowledgeDocument(mode: UrmsMode, documentId: string) {
  const body = await fetchJson<KnowledgeDocumentResponse>(
    `/v1/knowledge/documents/${encodeURIComponent(documentId)}`,
    mode,
  );
  return body?.data ?? null;
}

export async function fetchGoogleCalendarStatus(mode: UrmsMode) {
  const body = await fetchJson<GoogleCalendarStatusResponse>('/v1/schedule/google/status', mode);
  return body?.data ?? null;
}

export type AdvanceTaskResult = {
  ok: boolean;
  successMessage?: string;
};

function formatJournalSuccess(
  entry: AdvanceTaskResponse['meta']['journalEntry'],
): string | undefined {
  if (!entry) {
    return undefined;
  }

  const nextPart = entry.next ? ` → 次: ${entry.next}` : '';
  return `完了: ${entry.completed}${nextPart} · journal.md に追記`;
}

export async function advanceContextTask(mode: UrmsMode): Promise<AdvanceTaskResult> {
  const body = await fetchJson<AdvanceTaskResponse>('/v1/context/advance-task', mode, {
    method: 'POST',
  });
  if (!body?.data) {
    return { ok: false };
  }

  return {
    ok: true,
    successMessage:
      formatJournalSuccess(body.meta?.journalEntry ?? null) ??
      'Context 更新 · 次のフォーカスに切り替えました',
  };
}

export async function fetchIntegrations(mode: UrmsMode): Promise<ApiResult<IntegrationSummary[]>> {
  try {
    const response = await fetch(`${API_BASE}/v1/integrations`, {
      headers: {
        Accept: 'application/json',
        'X-URMS-Mode': mode,
      },
    });
    const payload = (await response.json()) as ApiListBody<IntegrationSummary> | { error?: { message?: string } };
    if (!response.ok) {
      const message = 'error' in payload ? payload.error?.message : undefined;
      return { ok: false, error: message ?? `HTTP ${response.status}` };
    }

    const list = 'data' in payload ? payload.data : undefined;
    return { ok: true, data: list ?? [] };
  } catch {
    return { ok: false, error: 'API に接続できません' };
  }
}

export async function fetchIntegrationHealth(
  mode: UrmsMode,
  integrationId: string,
): Promise<ApiResult<IntegrationHealth>> {
  return fetchJsonResult<IntegrationHealth>(
    `/v1/integrations/${encodeURIComponent(integrationId)}/health`,
    mode,
  );
}

export async function syncIntegration(mode: UrmsMode, integrationId: string): Promise<ApiResult<unknown>> {
  return fetchJsonResult<unknown>(`/v1/integrations/${encodeURIComponent(integrationId)}/sync`, mode, {
    method: 'POST',
  });
}

export async function exportIntegration(mode: UrmsMode, integrationId: string): Promise<ApiResult<unknown>> {
  return fetchJsonResult<unknown>(`/v1/integrations/${encodeURIComponent(integrationId)}/export`, mode, {
    method: 'POST',
  });
}
