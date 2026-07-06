import type { PerceptionResponse } from '@urms/shared';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

type ApiEnvelope<T> = {
  data?: T;
};

function apiHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-URMS-Mode': 'operate',
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...apiHeaders(),
        ...(init?.headers ?? {}),
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

export async function fetchPerception(): Promise<PerceptionResponse | null> {
  const body = await fetchJson<PerceptionResponse>('/v1/perception');
  if (!body?.data) return null;
  return body;
}

export async function advanceContextTask(): Promise<boolean> {
  const body = await fetchJson<ApiEnvelope<unknown>>('/v1/context/advance-task', {
    method: 'POST',
  });
  return body !== null;
}
