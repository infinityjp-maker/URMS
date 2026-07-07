import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ResourceEntity, UrmsMode } from '@urms/shared';
import { AppError, ERROR_CODES } from '@urms/shared';

import type { RelationService } from '../resource/relation-service.js';
import type { ResourceRepository } from '../repository/resource-repository.js';
import {
  AI_TEAM_SOURCES,
  fallbackNameFromPath,
  toRepoRelative,
} from './ai-team-sources.js';
import type { ParsedResourceMarkdown } from './parse-resource-markdown.js';
import { parseResourceMarkdown } from './parse-resource-markdown.js';
import { parseUrmsExportSummary } from './update-resource-markdown-urms-section.js';

export const AI_TEAM_ID = 'urms-ai-v1';

export type AiTeamSyncItem = {
  resourceType: string;
  resourceId: string;
  action: 'created' | 'updated' | 'skipped';
  sourcePath: string;
};

export type AiTeamSyncReport = {
  created: number;
  updated: number;
  skipped: number;
  relationsCreated: number;
  items: AiTeamSyncItem[];
};

export type AiTeamSyncServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
  relationService: RelationService;
};

export class AiTeamSyncService {
  private readonly repoRoot: string;
  private readonly resourceRepository: ResourceRepository;
  private readonly relationService: RelationService;

  constructor(options: AiTeamSyncServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.resourceRepository = options.resourceRepository;
    this.relationService = options.relationService;
  }

  async sync(actorId: string, mode: UrmsMode = 'operate'): Promise<AiTeamSyncReport> {
    const report: AiTeamSyncReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      relationsCreated: 0,
      items: [],
    };

    const roleIds: string[] = [];

    for (const source of AI_TEAM_SOURCES) {
      const files = await source.resolveFiles(this.repoRoot);
      for (const absolutePath of files) {
        const relativePath = toRepoRelative(this.repoRoot, absolutePath);
        const content = await readFile(absolutePath, 'utf8');
        const parsed = parseResourceMarkdown(content, relativePath, fallbackNameFromPath(relativePath));
        if (!parsed) {
          report.skipped += 1;
          report.items.push({
            resourceType: 'unknown',
            resourceId: path.basename(relativePath),
            action: 'skipped',
            sourcePath: relativePath,
          });
          continue;
        }

        const action = await this.upsertResource(parsed, content);
        report[action] += 1;
        report.items.push({
          resourceType: parsed.resourceType,
          resourceId: parsed.resourceId,
          action,
          sourcePath: relativePath,
        });

        if (parsed.resourceType === 'role') {
          roleIds.push(parsed.resourceId);
        }
      }
    }

    await this.ensureTeamResource();
    report.relationsCreated += await this.syncTeamMembership(roleIds, actorId, mode);

    return report;
  }

  private async upsertResource(
    parsed: ParsedResourceMarkdown,
    rawContent = '',
  ): Promise<'created' | 'updated'> {
    const existing = await this.resourceRepository.findByRef(parsed.resourceType, parsed.resourceId);
    const now = new Date().toISOString();
    const entity: ResourceEntity = {
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      name: parsed.name,
      status: 'active',
      metadata: {
        sourcePath: parsed.sourcePath,
        contentHash: parsed.contentHash,
        ssot: 'ai-team-sync',
        urmsSummary: parseUrmsExportSummary(rawContent) ?? parsed.name,
      },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.resourceRepository.save(entity);
    return existing ? 'updated' : 'created';
  }

  private async ensureTeamResource(): Promise<void> {
    await this.upsertResource({
      resourceType: 'team',
      resourceId: AI_TEAM_ID,
      name: 'URMS AI Team v1',
      sourcePath: 'docs/ai-team/00_Overview.md',
      contentHash: 'team',
    });
  }

  private async syncTeamMembership(roleIds: string[], actorId: string, mode: UrmsMode): Promise<number> {
    let created = 0;

    for (const roleId of roleIds) {
      try {
        await this.relationService.create(
          {
            fromType: 'role',
            fromId: roleId,
            toType: 'team',
            toId: AI_TEAM_ID,
            relationType: 'member_of',
          },
          actorId,
          mode,
        );
        created += 1;
      } catch (error) {
        if (error instanceof AppError && error.code === ERROR_CODES.RELATION_DUPLICATE) {
          continue;
        }
        throw error;
      }
    }

    return created;
  }
}

export function createAiTeamSyncService(options: AiTeamSyncServiceOptions): AiTeamSyncService {
  return new AiTeamSyncService(options);
}

function resolveRepoRoot(env: NodeJS.ProcessEnv = process.env): string {
  if (env.URMS_REPO_ROOT?.trim()) {
    return path.resolve(env.URMS_REPO_ROOT);
  }

  return path.resolve(process.cwd());
}

export function resolveAiTeamRepoRoot(env: NodeJS.ProcessEnv = process.env): string {
  return resolveRepoRoot(env);
}
