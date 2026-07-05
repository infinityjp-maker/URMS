import type { UrmsMode } from '@urms/shared';

export interface ApiErrorBody {
  code: string;
  message: string;
  details: Array<{ field?: string; message: string }>;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly details: ApiErrorBody['details'];
  readonly httpStatus: number;

  constructor(httpStatus: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.code = body.code;
    this.details = body.details;
    this.httpStatus = httpStatus;
  }
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ApiItemResponse<T> {
  data: T;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  mode: UrmsMode,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-URMS-Mode', mode);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json()) as T | { error: ApiErrorBody };

  if (!response.ok) {
    const errorBody = (payload as { error: ApiErrorBody }).error;
    throw new ApiClientError(response.status, errorBody);
  }

  return payload as T;
}

export function getResources(
  mode: UrmsMode,
  query: Record<string, string | undefined>,
): Promise<ApiListResponse<import('@urms/shared').ResourceEntity>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return request(`/v1/resources${suffix}`, mode);
}

export function getResource(
  mode: UrmsMode,
  resourceType: string,
  resourceId: string,
): Promise<ApiItemResponse<import('@urms/shared').ResourceEntity>> {
  return request(`/v1/resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`, mode);
}

export function createResource(
  mode: UrmsMode,
  body: {
    resourceType: string;
    resourceId: string;
    name: string;
    metadata?: Record<string, unknown>;
  },
): Promise<ApiItemResponse<import('@urms/shared').ResourceEntity>> {
  return request('/v1/resources', mode, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateResource(
  mode: UrmsMode,
  resourceType: string,
  resourceId: string,
  body: { name?: string; metadata?: Record<string, unknown> },
): Promise<ApiItemResponse<import('@urms/shared').ResourceEntity>> {
  return request(
    `/v1/resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
    mode,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export function changeResourceLifecycle(
  mode: UrmsMode,
  resourceType: string,
  resourceId: string,
  status: import('@urms/shared').ResourceStatus,
): Promise<ApiItemResponse<import('@urms/shared').ResourceEntity>> {
  return request(
    `/v1/resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/lifecycle`,
    mode,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
}

export interface AuditLogItem {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  actorId: string;
  mode: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export function getAuditLogs(
  mode: UrmsMode,
  query: Record<string, string | undefined>,
): Promise<ApiListResponse<AuditLogItem>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return request(`/v1/audit/logs${suffix}`, mode);
}

export function getContextDashboard(
  mode: UrmsMode,
): Promise<ApiItemResponse<import('@urms/shared').ContextDashboard>> {
  return request('/v1/context', mode);
}

export function updateContextDashboard(
  mode: UrmsMode,
  items: import('@urms/shared').ContextUpdateItem[],
): Promise<ApiItemResponse<import('@urms/shared').ContextDashboard>> {
  return request('/v1/context', mode, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
