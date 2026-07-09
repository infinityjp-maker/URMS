export type AppRoute =
  | { kind: 'dashboard' }
  | { kind: 'catalog' }
  | { kind: 'screen'; screenId: string };

export function parseAppRoute(hash = window.location.hash): AppRoute {
  const normalized = hash.replace(/^#/, '').replace(/\/$/, '') || '/';
  if (normalized === '/screens') {
    return { kind: 'catalog' };
  }
  if (normalized.startsWith('/M-') || normalized.startsWith('/D-0')) {
    return { kind: 'screen', screenId: normalized.slice(1) };
  }
  return { kind: 'dashboard' };
}

export function catalogHref(): string {
  return '#/screens';
}

export function screenHref(screenId: string): string {
  return `#/${screenId}`;
}

export function calendarDetailHref(dateKey: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('calDate', dateKey);
  const query = search.toString();
  return query ? `${path}?${query}#/M-CAL-DET` : `${path}#/M-CAL-DET`;
}

export function readCalendarDetailDate(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('calDate')?.trim();
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function operationsDetailHref(flowId: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('opsFlow', flowId);
  const query = search.toString();
  return query ? `${path}?${query}#/M-OPS-DET` : `${path}#/M-OPS-DET`;
}

export function readOperationsFlowId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('opsFlow')?.trim();
  return value || null;
}

export function readKnowledgeDocumentId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('docId')?.trim();
  return value || null;
}

export function knowledgeDocumentHref(documentId: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('docId', documentId);
  const query = search.toString();
  return query ? `${path}?${query}#/M-DOC-VIEW` : `${path}#/M-DOC-VIEW`;
}

export function phaseHref(phase: string): string {
  return `?phase=${phase}`;
}

export function currentDashboardHref(): string {
  const base = window.location.pathname || '/';
  const path = base.endsWith('/') ? base : `${base}/`;
  return `${path}${window.location.search}`;
}

export function hubHref(): string {
  const base = window.location.pathname || '/';
  return base.endsWith('/') ? base : `${base}/`;
}
