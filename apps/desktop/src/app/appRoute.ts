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

export function calendarDetailHref(dateKey: string, eventId?: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('calDate', dateKey);
  if (eventId) {
    search.set('eventId', eventId);
  } else {
    search.delete('eventId');
  }
  const query = search.toString();
  return query ? `${path}?${query}#/M-CAL-DET` : `${path}#/M-CAL-DET`;
}

export function readCalendarDetailDate(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('calDate')?.trim();
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function readCalendarEventId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('eventId')?.trim();
  return value || null;
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

export function readAssetId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('assetId')?.trim();
  return value || null;
}

export function assetPcHref(assetId: string): string {
  return pcPartsHref(assetId);
}

export function pcPartsHref(assetId?: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  if (assetId) {
    search.set('assetId', assetId);
  } else {
    search.delete('assetId');
  }
  const query = search.toString();
  return query ? `${path}?${query}#/M-AST-PC` : `${path}#/M-AST-PC`;
}

export function readStorageVolumeId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('volumeId')?.trim();
  return value || null;
}

export function storageDetailHref(volumeId: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('volumeId', volumeId);
  const query = search.toString();
  return query ? `${path}?${query}#/M-STR-DET` : `${path}#/M-STR-DET`;
}

export function readVideoId(search = window.location.search): string | null {
  const value = new URLSearchParams(search).get('videoId')?.trim();
  return value || null;
}

export function videoDetailHref(videoId: string): string {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const search = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  search.set('videoId', videoId);
  const query = search.toString();
  return query ? `${path}?${query}#/M-VID-DET` : `${path}#/M-VID-DET`;
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
