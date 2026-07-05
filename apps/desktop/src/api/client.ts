import type { PerceptionState } from '@urms/shared';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

type ApiEnvelope<T> = {
  data?: T;
};

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' },
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

export async function fetchPerception(): Promise<PerceptionState | null> {
  const body = await fetchJson<ApiEnvelope<PerceptionState>>('/v1/perception');
  return body?.data ?? null;
}
