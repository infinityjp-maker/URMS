import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { KnowledgeDocumentDetail, KnowledgeDocumentSummary, KnowledgeListPayload } from '@urms/shared';

import { findKnowledgeDocument, KNOWLEDGE_DOCUMENT_CATALOG } from './document-catalog.js';

export interface KnowledgeService {
  listDocuments(): Promise<KnowledgeListPayload>;
  getDocument(id: string): Promise<KnowledgeDocumentDetail | null>;
}

export type KnowledgeServiceOptions = {
  repoRoot: string;
};

function assertWithinRepo(repoRoot: string, relativePath: string): string {
  const resolved = path.resolve(repoRoot, relativePath);
  const root = path.resolve(repoRoot);
  if (!resolved.startsWith(root)) {
    throw new Error('Path escapes repository root');
  }
  return resolved;
}

export class FileKnowledgeService implements KnowledgeService {
  private readonly repoRoot: string;

  constructor(options: KnowledgeServiceOptions) {
    this.repoRoot = options.repoRoot;
  }

  async listDocuments(): Promise<KnowledgeListPayload> {
    const documents: KnowledgeDocumentSummary[] = KNOWLEDGE_DOCUMENT_CATALOG.map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
    }));

    return { documents };
  }

  async getDocument(id: string): Promise<KnowledgeDocumentDetail | null> {
    const entry = findKnowledgeDocument(id);
    if (!entry) {
      return null;
    }

    try {
      const absolute = assertWithinRepo(this.repoRoot, entry.path);
      const content = await readFile(absolute, 'utf8');
      return {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        summary: entry.summary,
        path: entry.path,
        content,
      };
    } catch {
      return null;
    }
  }
}

export function createKnowledgeService(options: KnowledgeServiceOptions): KnowledgeService {
  return new FileKnowledgeService(options);
}
