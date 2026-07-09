import { describe, expect, it } from 'vitest';

import { buildOperationFlowDetail, buildOperationFlows } from './operation-flows.js';

const baseSnapshot = {
  checkedAt: new Date('2026-07-09T08:00:00+09:00'),
  apiHealthy: true,
  database: 'ok' as const,
  weather: 'live' as const,
  scheduleEnabled: true,
  transportEnabled: true,
  transportHasAdvice: true,
  timetableSource: 'interval' as const,
  integrations: [{ integrationId: 'cursor-local', name: 'Cursor Local', healthy: true, detail: 'ok' }],
};

describe('buildOperationFlows', () => {
  it('returns all operation flows', () => {
    const payload = buildOperationFlows(baseSnapshot);
    expect(payload.flows).toHaveLength(6);
    expect(payload.alertCount).toBeGreaterThan(0);
  });

  it('marks database error when unavailable', () => {
    const payload = buildOperationFlows({ ...baseSnapshot, database: 'unavailable' });
    const db = payload.flows.find((flow) => flow.id === 'database');
    expect(db?.status).toBe('error');
  });

  it('builds flow detail with checks and next action', () => {
    const detail = buildOperationFlowDetail('transport', {
      ...baseSnapshot,
      timetableSource: 'odpt',
    });
    expect(detail?.checks.some((check) => check.label === '駅時刻表')).toBe(true);
    expect(detail?.nextAction).toContain('ODPT');
  });
});
