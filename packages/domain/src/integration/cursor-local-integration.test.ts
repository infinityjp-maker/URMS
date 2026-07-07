import { describe, expect, it, vi } from 'vitest';

import { CursorLocalIntegration } from './cursor-local-integration.js';

describe('CursorLocalIntegration', () => {
  it('merges aiTeam and context export reports', async () => {
    const aiTeamReport = { updated: 2, unchanged: 1, skipped: 0, items: [] };
    const contextReport = { updated: 1, unchanged: 2, skipped: 0, items: [] };

    const integration = new CursorLocalIntegration({
      repoRoot: process.cwd(),
      aiTeamSyncService: { sync: vi.fn() } as never,
      aiTeamExportService: {
        export: vi.fn(async () => aiTeamReport),
      } as never,
      contextSsotExportService: {
        export: vi.fn(async () => contextReport),
      } as never,
    });

    const report = await integration.export!('developer');

    expect(report).toEqual({ aiTeam: aiTeamReport, context: contextReport });
  });
});
