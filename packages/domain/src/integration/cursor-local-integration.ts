import { access } from 'node:fs/promises';
import path from 'node:path';

import type { AiTeamExportService } from '../ai-team/ai-team-export-service.js';
import type { AiTeamSyncService } from '../ai-team/ai-team-sync-service.js';
import type {
  ContextSsotExportService,
  CursorCombinedExportReport,
} from '../context/context-ssot-export-service.js';
import { sumExportConflicts } from '../context/context-ssot-export-service.js';
import type { IntegrationAdapter, IntegrationHealth } from './integration-adapter.js';

export type CursorIntegrationOptions = {
  repoRoot: string;
  aiTeamSyncService: AiTeamSyncService;
  aiTeamExportService: AiTeamExportService;
  contextSsotExportService: ContextSsotExportService;
};

export class CursorLocalIntegration implements IntegrationAdapter {
  readonly integrationId = 'cursor-local';
  readonly name = 'Cursor Local Workspace';
  private readonly repoRoot: string;
  private readonly aiTeamSyncService: AiTeamSyncService;
  private readonly aiTeamExportService: AiTeamExportService;
  private readonly contextSsotExportService: ContextSsotExportService;

  constructor(options: CursorIntegrationOptions) {
    this.repoRoot = options.repoRoot;
    this.aiTeamSyncService = options.aiTeamSyncService;
    this.aiTeamExportService = options.aiTeamExportService;
    this.contextSsotExportService = options.contextSsotExportService;
  }

  async healthCheck(): Promise<IntegrationHealth> {
    try {
      await access(path.join(this.repoRoot, '.cursor', 'rules'));
      return {
        integrationId: this.integrationId,
        healthy: true,
        detail: `Workspace OK · ${this.repoRoot}`,
      };
    } catch {
      return {
        integrationId: this.integrationId,
        healthy: false,
        detail: `Workspace not found · ${this.repoRoot}`,
      };
    }
  }

  async sync(actorId: string) {
    return this.aiTeamSyncService.sync(actorId, 'develop');
  }

  async export(actorId: string): Promise<CursorCombinedExportReport> {
    const [aiTeam, context] = await Promise.all([
      this.aiTeamExportService.export(actorId, 'develop'),
      this.contextSsotExportService.export(actorId, 'develop'),
    ]);
    return { aiTeam, context, conflicts: sumExportConflicts(aiTeam, context) };
  }
}
