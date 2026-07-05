import { access } from 'node:fs/promises';
import path from 'node:path';

import type { AiTeamSyncService } from '../ai-team/ai-team-sync-service.js';
import type { IntegrationAdapter, IntegrationHealth } from './integration-adapter.js';

export type CursorIntegrationOptions = {
  repoRoot: string;
  aiTeamSyncService: AiTeamSyncService;
};

export class CursorLocalIntegration implements IntegrationAdapter {
  readonly integrationId = 'cursor-local';
  readonly name = 'Cursor Local Workspace';
  private readonly repoRoot: string;
  private readonly aiTeamSyncService: AiTeamSyncService;

  constructor(options: CursorIntegrationOptions) {
    this.repoRoot = options.repoRoot;
    this.aiTeamSyncService = options.aiTeamSyncService;
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
}
