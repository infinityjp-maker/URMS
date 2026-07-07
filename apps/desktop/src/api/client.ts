import type { AdvanceTaskResponse, PerceptionResponse } from '@urms/shared';

import type { DeviceCoords } from '../lib/device-location.js';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

type ApiEnvelope<T> = {
  data?: T;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const method = init?.method?.toUpperCase() ?? 'GET';
    const usesJsonBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    const body = init?.body ?? (usesJsonBody ? '{}' : undefined);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-URMS-Mode': 'operate',
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

export async function fetchHealth(): Promise<boolean> {
  const body = await fetchJson<ApiEnvelope<{ status: string }>>('/health');
  return body?.data?.status === 'ok';
}

export async function fetchReady(): Promise<boolean> {
  const body = await fetchJson<ApiEnvelope<{ status: string }>>('/health/ready');
  return body?.data?.status === 'ready';
}

export async function fetchPerception(deviceCoords?: DeviceCoords | null): Promise<PerceptionResponse | null> {
  const query =
    deviceCoords != null
      ? `?latitude=${encodeURIComponent(String(deviceCoords.latitude))}&longitude=${encodeURIComponent(String(deviceCoords.longitude))}`
      : '';
  const body = await fetchJson<PerceptionResponse>(`/v1/perception${query}`);
  if (!body?.data) return null;
  return body;
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

export async function advanceContextTask(): Promise<AdvanceTaskResult> {
  const body = await fetchJson<AdvanceTaskResponse>('/v1/context/advance-task', {
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
